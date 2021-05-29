#!/usr/bin/env node

const utils = require('./src/utils');
const deployment = require('./src/deployment')

/**
 * Verifying GitHub action inputs
 */
 async function verifyInputs(data) {
    if(!data.pkgName || data.pkgName === '')
        throw new Error('Missing input "pkg_name"')
    if(data.npm){
        if(!data.npm.token || data.npm.token === '')
            throw new Error('Mising input "npm_access_token"')
    }
    if(data.github){
        if(!data.github.token || data.github.token === '')
            throw new Error('Mising input "github_access_token"')
    }
}

(async () => {
    try {
        const cliArguments = process.argv.slice(3)//.join(' ');
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
                    registry: npmRegistry ? npmRegistry.split('=')[1]: undefined,
                    scope: npmScope ? npmScope.split('=')[1]: undefined
                }: undefined;
                const githubToken = cliArguments.find(arg => arg.includes('--github-access-token'));
                data.github = githubToken !== undefined ? {
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
        throw Error(error);
    }
})();

/**
 * (async () => {
    try {
        const data = {
            pkgName: pkgName,
            debug: debug,
            prettyPrint: prettyPrint,
            dryRun: dryRun
        }
        data.npm = isNPM ? {
            token: npmAccessToken,
            registry: npmRegistry,
            scope: npmScope
        }: undefined;
        data.github = isGitHub ? {
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
 */