const exec = require('@actions/exec');
const core = require('@actions/core');
const child_process = require('child_process');

const github_access_token = core.getInput('github_access_token');
const npm_access_token = core.getInput('npm_access_token');
const pkg_name = core.getInput('pkg_name');
const pkg_registry = core.getInput('pkg_registry');
const dry_run = core.getInput('dry_run')
const pretty_print = core.getInput('pretty_print')

function configureNPM(token, registry) {
    //Creating the .npmrc file
    execute(`echo "registry=${registry}" >> ~/.npmrc && echo "//${registry}:_authToken=${token}" >> ~/.npmrc`);
    //Renaming the .npmrc file so NPM will auto detect it
    execute(`ls -a || mv "~:.npmrc" .npmrc`);
}

function configureGitHub(pkgName) {
    execute(`git config --global user.name "Deploy BOT" && git config --global user.email "bot@${pkgName}.com"`)
}

/**
 * Executing a shell command
 * @param command The command
 */
 async function execute(command) {
    return new Promise((done, failed) => {
        child_process.exec(command, (error, stdout, stderr) => {
        	if (error !== null) failed(error)
        	done({ stdout, stderr })
        })
    })
}

/**
 * Retrieving the current version of the package
 * @param cliArguments The additional cli arguments
 */
 async function getCurrentVersion(pkgName) {
    const stdout = (await execute(`npm info ${pkgName} version`)).stdout.replace('\n', '');
    const split = stdout.split('.');
	return {
		major: parseInt(split[0]),
		minor: parseInt(split[split.length-2]),
		patch: parseInt(split[split.length-1])
	}
}

/**
 * Retrieving the version of the current package
 * @param cliArguments The additional CLI arguments
 */
async function getUpgradeVersion(pkgName, registry) {
    if(await doesPackageExist(pkgName, registry)) {
	    const version = await getCurrentVersion(pkgName);
	    if(version.patch < 9) version.patch++;
	    else if(version.patch === 9 && version.minor < 9) {version.patch = 0; version.minor++}
	    else if(version.patch === 9 && version.minor === 9 ) {version.patch = 0; version.minor = 0; version.major++;}
        return `${version.major}.${version.minor}.${version.patch}`
    }
    return '0.0.1';
}

/***
 * Retrieving the args for the CLI commands
 */
function getCliArguments() {
    let args = '';
    if(pkg_registry)
        args+= ` --registry=${pkg_registry}`;
    if(dry_run === 'true' || dry_run === true)
        args+= ` --dry-run`;
    console.log(`Given args: ${args}`)
    return args;
}

/**
 * Checking if the pacakge exists in the relevant NPM registry
 * @param cliArguments The additional CLI arguments
 */
async function doesPackageExist(pkgName, cliArguments) {
    const arrayArguments = cliArguments.split(' ')
    const isScopedRegistry = arrayArguments.findIndex((item) => item.includes('--registry') && !item.includes('registry.npmjs.org')) !== -1;
    const isScope = arrayArguments.findIndex((item) => item.includes('--scope')) !== -1;
    if(!isScopedRegistry && !isScope) {
        const response = await execute(`npm search ${pkgName} ${cliArguments}`);
        return response.stdout.indexOf(`No matches found for "${pkgName}"\n`) === -1;
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
function parseDeployment(output) {
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

(async () => {
    configureNPM(npm_access_token, pkg_registry);
    configureGitHub(pkg_name)
    const version = await getCurrentVersion(pkg_name)
    const updateVersion = await getUpgradeVersion(pkg_name, pkg_registry);
    const cliArguments = getCliArguments();
    console.log(`Upgrading ${pkg_name}@${version.major}.${version.minor}.${version.patch} to version ${pkg_name}@${updateVersion}`)
    await execute(`npm version ${updateVersion} --allow-same-version ${cliArguments}`);
    const publish = await execute(`npm publish ${cliArguments} --dry-run`);
    console.log('==== Publish Output ====')
    if(pretty_print === 'true' || pretty_print === true) {
        const prettyPublish = parseDeployment(publish);
        const { files, ...rest } = prettyPublish
        console.log(`files: ${files.toString().replace(/,/g, ', ')}`)
        for(const item in rest) {
            console.log(`${item}: ${rest[item].toString()}`)
        }
        console.log('========================')
    }
    else
        console.log(publish)
})();