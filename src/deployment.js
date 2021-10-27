const utils = require('./utils');
const github = require('./github');
const npm = require('./npm');

/**
 * Deploying pkg version
 * @param {*} data The data passed to the deployment
 */
export async function deploy(data) {
    //Configuration section
    let mainPublishVersion = undefined;
    await github.configureGitHub(data.pkgName)
    if(data.mainPackageManager) {
        mainPublishVersion = await getMainPublishVersion(data, data.mainPackageManager)
        await utils.execute(`echo "The main package manager ${data.mainPackageManager} has version ${mainPublishVersion}"`, data.debug)
    }
    if(data.npm) {
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
    //GitHub Release section
    if(data.github) {
        //version, branch, draft, preRelease
        const currentVersion = mainPublishVersion ? mainPublishVersion: await github.getCurrentVersion(data.github);
        const publishVersion = utils.getNextVersion(currentVersion);
        await github.releaseGitHubVersion({
            owner: data.github.owner,
            repo: data.github.repo,
            token: data.github.token,
            version: publishVersion,
            branch: 'master',
            draft: false,
            preRelease: false,
            debug: data.debug,
            dryRun: data.dryRun
        })
    }
}

/**
 * 
 * @param {*} data 
 * @param {*} mainManagerName 
 * @returns 
 */
async function getMainPublishVersion(data, mainManagerName) {
    let currentVersion = null;
    switch(mainManagerName) {
        case 'github':
            currentVersion = await github.getCurrentVersion(data.github);
        case 'npm':
            currentVersion = await npm.getCurrentVersion(data.pkgName, data.workingDirectory)
        default:
            break;
    }
    return utils.getNextVersion(currentVersion);
}