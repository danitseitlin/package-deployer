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
        await npm.deployNpmRelease(data, mainPublishVersion);
    }
    //GitHub Release section
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