const deployment = require('./src/deployment')
const github = require('@actions/github');
const utils = require('./src/utils')
const core = require('@actions/core');
const workingDirectory = core.getInput('working_directory')
const mainPkgManager = core.getInput('main_pkg_manager');
const packageManagers = core.getInput('pkg_managers');
const githubAccessToken = core.getInput('github_access_token');
const npmAccessToken = core.getInput('npm_access_token');
const npmRegistry = core.getInput('npm_registry');
const npmScope = core.getInput('npm_scope')
const dryRun = core.getInput('dry_run')
const prettyPrint = core.getInput('pretty_print')
const debug = core.getInput('debug');
const isNPM = packageManagers.indexOf('npm') !== -1;
const isGitHub = packageManagers.indexOf('github') !== -1;
let pkgName = core.getInput('pkg_name');

/**
 * Verifying GitHub action inputs
 * @param {*} data The data to verify to inputs of
 */
async function verifyInputs(data) {
    if(!data.pkgName || data.pkgName === '')
        throw new Error('Missing input "pkg_name"');
    if(data.npm){
        if(!data.npm.token || data.npm.token === '')
            throw new Error('Mising input "npm_access_token"');
    }
    if(data.github){
        if(!data.github.token || data.github.token === '')
            throw new Error('Mising input "github_access_token"');
    }
}

(async () => {
    try {
        const data = {
            workingDirectory: workingDirectory,
            pkgName: pkgName,
            debug: utils.stringToBoolean(debug),
            prettyPrint: utils.stringToBoolean(prettyPrint),
            dryRun: utils.stringToBoolean(dryRun),
            mainPackageManager: mainPkgManager
        }
        data.npm = isNPM ? {
            token: npmAccessToken,
            registry: npmRegistry,
            scope: npmScope
        }: undefined;
        data.github = isGitHub ? {
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            token: githubAccessToken
        }: undefined;
        //Verifying inputs
        verifyInputs(data);
        await deployment.deploy(data);
    }
    catch(e) {
        core.setFailed(e.toString());
    }
})();
