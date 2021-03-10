#!/usr/bin/env node
import { PackageCli, printHelp } from './cli';

(async () => {
    try {
        const cliArguments = process.argv.slice(3).join(' ');
        const isTriggered = (process.argv[1].includes('npm-deploy') || process.argv[1].includes('\\npm-package-deployer\\lib\\index.js'));
        //Verifying the deploy CLI command was executed
        if(process.argv[0].includes('node') && isTriggered && process.argv.length >= 3) {
            const packageName = process.argv[2];
            if(packageName === '--help')
                printHelp();
            else {
                const cli = new PackageCli(packageName)
                if(!await cli.isAuthenticated())
                    throw Error('Auth is required!')
                await cli.upgradePackage(cliArguments);
            }
        }
        else printHelp()
    } catch (error) {
        console.log(error);
        throw Error(error);
    }
})();