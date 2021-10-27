import { deploy } from './deployment';

const utils = require('./utils')

/**
 * Configurating NPM
 * @param {*} data The data of the NPM
 */
export async function configureNPM(data) {
    await utils.execute(`echo "registry=https://registry.npmjs.org/" >> "${data.workingDirectory}/.npmrc"`, data.debug);
    if(data.scope !== '') {
        await utils.execute(`echo "@${data.scope}:registry=https://${data.registry}/${data.scope}" >> "${data.workingDirectory}/.npmrc"`, data.debug);
    }
    await utils.execute(`echo "//${data.registry}/:_authToken=${data.token}" >> "${data.workingDirectory}/.npmrc"`, data.debug);
}

/**
 * Retrieving the current version of the package
 * @param {*} pkgName The name of the package
 */
export async function getCurrentVersion(pkgName, workingDirectory = './') {
    try {
        const currentVersion = await utils.execute(`cd ${workingDirectory} && npm info ${pkgName} version`);
        return currentVersion.stdout.replace('\n', '');
    }
    catch (err) {
        return '0.0.1'
    }
}

/**
 * Retrieving the version of the current package
 * @param {*} pkgName The name of the package
 * @param {*} cliArguments The additional CLI arguments
 */
export async function getUpgradeVersion(pkgName, cliArguments) {
    if(await doesPackageExist(pkgName, cliArguments)) {
        const currentVersion = await getCurrentVersion(pkgName);
        const version = getNextVersion(currentVersion);
        return version;
    }
    return '0.0.1';
}

/***
 * Retrieving the args for the CLI commands
 * @param {*} data The given data of the deployment
 */
export function getCliArguments(data) {
    let args = '';
    if(data.npm.registry && data.npm.registry !== 'registry.npmjs.org')
        args += ` --registry=https://${data.npm.registry}`;
    if(data.npm.scope && data.npm.scope !== '')
        args += ` --scope=@${data.npm.scope}`;
    if(data.dryRun === 'true' || data.dryRun === true)
        args += ` --dry-run`;
    return args;
}

/**
 * Checking if the pacakge exists in the relevant NPM registry
 * @param {*} pkgName The name of the package
 * @param {*} cliArguments The additional CLI arguments
 */
export async function doesPackageExist(pkgName, cliArguments) {
    const arrayArguments = cliArguments.split(' ')
    const isScopedRegistry = arrayArguments.findIndex((item) => item.includes('--registry') && !item.includes('registry.npmjs.org')) !== -1;
    const isScope = arrayArguments.findIndex((item) => item.includes('--scope')) !== -1;

    if(!isScopedRegistry && !isScope) {
        const response = await utils.execute(`npm search ${pkgName}${cliArguments}`);
        const isExists = response.stdout.indexOf(`No matches found for "${pkgName}"`) === -1;
        return isExists;
    }
    else {
        console.log('Because of known NPM issues, we do not search for the package existence before deployment of Scoped packages.')
        return true;
    }
}

/**
 * Parsing the publish output to a more pretified version
 * @param output The publish output
 */
export function parseDeployment(output) {
    const split = output.stderr.split('\n');
    const name = split.find(item => item.includes('name'))
    const version = split.find(item => item.includes('version'))
    const size = split.find(item => item.includes('package size'))
    const unpackedSize = split.find(item => item.includes('unpacked size'))
    const shasum = split.find(item => item.includes('shasum'))
    const integrity = split.find(item => item.includes('integrity'))
    const totalFiles = split.find(item => item.includes('total files'))
    const files = []
    const filesStartIndex = split.findIndex(item => item.includes('Tarball Contents'))
    const filesEndIndex = split.findIndex(item => item.includes('Tarball Details'))
    //Parsing only the files
    for(let i = filesStartIndex+1; i < filesEndIndex; i++) {
        files.push(split[i].split('B ')[1].replace(/ /g, '').replace('\n', ''));
    }
    //Building and returning the rest of the JS object
    return {
        files: files,
        name: (name !== undefined) ? name.replace(/  /g, '').split(':')[1]: null,
        version: (version !== undefined) ? version.replace(/  /g, '').split(': ')[1].replace(/ /g, ''): null,
        size: (size !== undefined) ? size.replace(/  /g, '').split(':')[1]: null,
        unpackedSize: (unpackedSize !== undefined) ? unpackedSize.replace(/  /g, '').split(': ')[1].replace(/ /g, ''): null,
        shasum: (shasum !== undefined) ? shasum.replace(/  /g, '').split(':')[1]: null,
        integrity: (integrity !== undefined) ? integrity.replace(/  /g, '').split(': ')[1]: null,
        totalFiles: (totalFiles !== undefined) ? parseInt(totalFiles.replace(/  /g, '').split(': ')[1]): null,
    }
}

/**
 * Deploying an NPM package
 * @param {*} data The data of the action
 * @param {*} mainPublishVersion The main publish version. if available.
 */
export async function deployNpmRelease(data, mainPublishVersion) {
    let pkgName = data.pkgName;
    if(data.npm.scope && data.npm.scope !== ''){
        pkgName = `@${data.npm.scope}/${data.pkgName}`;
        data.pkgName = pkgName;
    }
    await npm.configureNPM({
        token: data.npm.token,
        registry: data.npm.registry,
        scope: data.npm.scope,
        workingDirectory: data.workingDirectory,
        debug: data.debug
    });
    //NPM Package deployment section
    const cliArguments = npm.getCliArguments(data);
    await utils.execute(`echo "args: ${cliArguments}"`, data.debug)
    const currentVersion = mainPublishVersion ? mainPublishVersion: await npm.getCurrentVersion(pkgName, data.workingDirectory)
    await utils.execute(`echo "current ver: ${JSON.stringify(currentVersion)}"`, data.debug)
    const packageExists = await npm.doesPackageExist(pkgName, cliArguments);
    await utils.execute(`echo "package exists? ${packageExists}"`, data.debug);
    const publishVersion = packageExists ? utils.getNextVersion(currentVersion): '0.0.1';
    if(packageExists) {
        await utils.execute(`echo "new ver: ${publishVersion}"`, data.debug);
        console.log(`Upgrading ${pkgName}@${currentVersion} to version ${pkgName}@${publishVersion}`);
    }
    else {
        console.log(`Publishing new package ${pkgName}@${publishVersion}`);
    }
    await utils.execute(`cd ${data.workingDirectory} && ls && npm version ${publishVersion} --allow-same-version${cliArguments}`, data.debug);
    const publish = await utils.execute(`cd ${data.workingDirectory} && npm publish${cliArguments}`, data.debug);
    console.log('==== Publish Output ====')
    if(data.prettyPrint === 'true' || data.prettyPrint === true) {
        const prettyPublish = npm.parseDeployment(publish);
        const { files, ...rest } = prettyPublish
        for(const item in rest) {
            console.log(`${item}: ${rest[item].toString()}`)
        }
        console.log(`files: ${files.toString().replace(/,/g, ', ')}`)
        console.log('========================')
    }
    else {
        console.log(publish)
    }
}