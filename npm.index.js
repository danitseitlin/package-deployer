#!/usr/bin/env node

const utils = require('./src/utils');
const deployment = require('./src/deployment')

/**
 * Verifying GitHub action inputs
 * @param {*} data The data to verify the inputs of
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
        if(!data.github.owner || data.github.owner === '')
            throw new Error('Mising input "github_owner"');
        if(!data.github.repo || data.github.repo === '')
            throw new Error('Mising input "github_repo"');
    }
}

(async () => {
    try {
        const cliArguments = process.argv.slice(3)
        const isTriggered = (process.argv[1].includes('deploy-pkg') || process.argv[1].includes('\\npm-package-deployer\\lib\\npm.index.js'));
        //Verifying the deploy CLI command was executed
        if(process.argv[0].includes('node') && isTriggered && process.argv.length >= 3) {
            const packageName = process.argv[2];
            if(packageName === '--help')
                utils.printHelp();
            else {
                const data = {
                    pkgName: packageName,
                    debug: cliArguments.find(arg => arg.includes('--debug')) !== undefined,
                    prettyPrint: cliArguments.find(arg => arg.includes('--pretty-print')) !== undefined,
                    dryRun: cliArguments.find(arg => arg.includes('--dry-run')) !== undefined
                }
                const npmToken = cliArguments.find(arg => arg.includes('--npm-access-token'));
                const npmRegistry = cliArguments.find(arg => arg.includes('--npm-registry'));
                const npmScope = cliArguments.find(arg => arg.includes('--npm-scope'));
                data.npm = npmToken !== undefined ? {
                    token: npmToken ? npmToken.split('=')[1]: undefined,
                    registry: npmRegistry ? npmRegistry.split('=')[1]: 'registry.npmjs.org',
                    scope: npmScope ? npmScope.split('=')[1]: ''
                }: undefined;
                const githubToken = cliArguments.find(arg => arg.includes('--github-access-token'));
                const githubOwner = cliArguments.find(arg => arg.includes('--github-owner'));
                const githubRepo = cliArguments.find(arg => arg.includes('--github-repo'));
                data.github = githubToken !== undefined ? {
                    owner: githubOwner ? githubOwner.split('=')[1]: undefined,
                    repo: githubRepo ? githubRepo.split('=')[1]: undefined,
                    token: githubToken ? githubToken.split('=')[1]: undefined
                }: undefined;

                console.log(data)
                //Verifying inputs
                verifyInputs(data);
                await deployment.deploy(data);
            }
        }
        else utils.printHelp()
    } catch (error) {
        console.log(error);
        //throw Error(error);
    }
})();