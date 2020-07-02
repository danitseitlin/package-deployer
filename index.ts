#!/usr/bin/env node
import * as child_process  from 'child_process';
(async () => {
    try {
        const cliArguments = process.argv.slice(3).join(' ')
        const isNPMDeploy = (process.argv[1].includes('npm-deploy') || process.argv[1].includes('\\npm-package-deployer\\lib\\index.js'))
        if(process.argv[0].includes('node') && isNPMDeploy === true && process.argv.length >= 3) {
            const packageName = process.argv[2];
            console.log(`Starting deployment for ${packageName}`)
            const version = await getVersion(packageName, cliArguments)
            console.log(`Upgrading to version: ${version}`)
            await execute(`npm version ${version} --allow-same-version ${cliArguments}`);
            console.log(await execute(`npm publish ${cliArguments}`));
        }
        else console.log('Example: npm-deploy <package name>\nIt is also possible to pass on additional NPM parameters')
    } catch (e) {
        console.log(e)
    }
})();

async function getVersion(packageName: string, cliArguments: string): Promise<string> {
    if(await doesPackageExist(packageName, cliArguments)) {
        const stdout = (await execute(`npm info ${packageName} version ${cliArguments}`)).stdout.replace('\n', '');
        const split = stdout.split('.');
	    const version = {
	    	major: parseInt(split[0]),
	    	minor: parseInt(split[split.length-2]),
	    	patch: parseInt(split[split.length-1])
	    }
	    if(version.patch < 9) version.patch++;
	    else if(version.patch === 9 && version.minor < 9) {version.patch = 0; version.minor++}
	    else if(version.patch === 9 && version.minor === 9 ) {version.patch = 0; version.minor = 0; version.major++;}
        return `${version.major}.${version.minor}.${version.patch}`
    }
    return '0.0.1';
}

async function doesPackageExist(packageName: string, cliArguments: string): Promise<boolean> {
    const response = await execute(`npm search ${packageName} ${cliArguments}`);
    return response.stdout.indexOf(`No matches found for "${packageName}"\n`) === -1;
}

function execute(command: string): Promise<{ stdout: string, stderr: string }> {
    return new Promise((done, failed) => {
        child_process.exec(command, (error, stdout, stderr) => {
          if (error !== null) failed(error)
          done({ stdout, stderr })
        })
    })
}