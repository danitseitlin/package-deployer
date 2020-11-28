import * as child_process  from 'child_process';

export async function isAuthenticated(): Promise<boolean> {
    try {
        await execute('npm whoami')
        return true
        //return !stdout.includes('npm ERR! 401 Unauthorized - GET https://registry.npmjs.org/-/whoami')
    } catch(e) {
        //return !e.includes('npm ERR! 401 Unauthorized - GET https://registry.npmjs.org/-/whoami')
        return false;
    }
}

/**
 * 
 * @param packageName 
 * @param cliArguments 
 */
async function getCurrentVersion(packageName: string, cliArguments: string) {
    const stdout = (await execute(`npm info ${packageName} version ${cliArguments}`)).stdout.replace('\n', '');
    const split = stdout.split('.');
	return {
		major: parseInt(split[0]),
		minor: parseInt(split[split.length-2]),
		patch: parseInt(split[split.length-1])
	}
}

/**
 * Retrieving the version of the current package
 * @param packageName The name of the package
 * @param cliArguments The additional CLI arguments
 */
async function getUpgradeVersion(packageName: string, cliArguments: string): Promise<string> {
    if(await doesPackageExist(packageName, cliArguments)) {
        //const stdout = (await execute(`npm info ${packageName} version ${cliArguments}`)).stdout.replace('\n', '');
        //const split = stdout.split('.');
	    const version = await getCurrentVersion(packageName, cliArguments);
	    if(version.patch < 9) version.patch++;
	    else if(version.patch === 9 && version.minor < 9) {version.patch = 0; version.minor++}
	    else if(version.patch === 9 && version.minor === 9 ) {version.patch = 0; version.minor = 0; version.major++;}
        return `${version.major}.${version.minor}.${version.patch}`
    }
    return '0.0.1';
}

/**
 * Checking if the pacakge exists in the relevant NPM registry
 * @param packageName The name of the package
 * @param cliArguments The additional CLI arguments
 */
async function doesPackageExist(packageName: string, cliArguments: string): Promise<boolean> {
    const arrayArguments = cliArguments.split(' ')
    const isScopedRegistry = arrayArguments.findIndex((item: string) => item.includes('--registry') && !item.includes('registry.npmjs.org')) !== -1;
    const isScope = arrayArguments.findIndex((item: string) => item.includes('--scope')) !== -1;
    if(!isScopedRegistry && !isScope) {
        const response = await execute(`npm search ${packageName} ${cliArguments}`);
        return response.stdout.indexOf(`No matches found for "${packageName}"\n`) === -1;
    }
    else {
        console.log('Because of known NPM issues, we do not search for the package existence before deployment of Scoped packages.')
        return true;
    }
}

/**
 * Executes a shell command
 * @param command The command
 */
function execute(command: string): Promise<{ stdout: string, stderr: string }> {
    return new Promise((done, failed) => {
        child_process.exec(command, (error, stdout, stderr) => {
          if (error !== null) failed(error)
          done({ stdout, stderr })
        })
    })
}