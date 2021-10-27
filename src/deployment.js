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
    //In case we set a main package manager, we wil obtain it's next version.
    if(data.mainPackageManager) {
        mainPublishVersion = await getMainPublishVersion(data, data.mainPackageManager)
        await utils.execute(`echo "The main package manager ${data.mainPackageManager} has version ${mainPublishVersion}"`, data.debug)
    }
    //In case we set a release of an NPM package
    if(data.npm) {
        await npm.deployNpmRelease(data, mainPublishVersion);
    }
    //In case we set a release of a GitHub release
    if(data.github) {
        await github.deployGithubRelease(data, mainPublishVersion);
    }
}

/**
 * Retrieving the main publish version
 * @param {*} data The data of the action
 * @param {*} mainManagerName The main manager name.
 * @returns The next version of the main manager name
 */
async function getMainPublishVersion(data, mainManagerName) {
    let currentVersion = null;
    console.log(`manager: ${mainManagerName}`)
    switch(mainManagerName) {
        case 'github':
            currentVersion = await github.getCurrentGitHubVersion(data);
            break;
        case 'npm':
            currentVersion = await npm.getCurrentVersion(data.pkgName, data.workingDirectory);
            break;
        default:
            break;
    }
    return utils.getNextVersion(currentVersion);
}