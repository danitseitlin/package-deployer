#!/usr/bin/env node
import * as child_process  from 'child_process';
(async () => {
    try {
        if(process.argv[0].includes('node') && process.argv[1].includes('npm-deploy')) {
            const packageName = process.argv[2];
            console.log(`Starting deployment for ${packageName}`)
            const version = await getVersion(packageName)
            console.log(`Upgrading to version: ${version}`)
            await execute(`npm version ${version} --allow-same-version`);
            console.log(await execute(`npm publish`));
        }
        else console.log('example: npm-deploy <package name>')
    } catch (e) {
        console.log(e)
    }
})();

async function getVersion(packageName: string): Promise<string> {
    if(await doesPackageExist(packageName)) {
        const stdout = (await execute(`npm info ${packageName} version`)).stdout.replace('\n', '');
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

async function doesPackageExist(packageName: string): Promise<boolean> {
    const response = await execute(`npm search ${packageName}`);
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