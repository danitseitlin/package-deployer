import * as child_process  from 'child_process';

/**
 * Executing a shell command
 * @param command The command
 */
export async function execute(command: string): Promise<{stdout: string, stderr: string}> {
    return new Promise((done, failed) => {
        child_process.exec(command, (error, stdout, stderr) => {
        	if (error !== null) failed(error)
        	done({ stdout, stderr })
        })
    })
}

/**
 * Retrieving the current version of the package
 * @param cliArguments The additional cli arguments
 */
export async function getCurrentVersion(pkgName: string): Promise<Version> {
    const stdout = (await execute(`npm info ${pkgName} version`)).stdout.replace('\n', '');
    const split = stdout.split('.');
	return {
		major: parseInt(split[0]),
		minor: parseInt(split[split.length-2]),
		patch: parseInt(split[split.length-1])
	}
}

/**
 * Retrieving the version of the current package
 * @param cliArguments The additional CLI arguments
 */
export async function getUpgradeVersion(pkgName: string, registry: string): Promise<string> {
    if(await doesPackageExist(pkgName, registry)) {
	    const version = await getCurrentVersion(registry);
	    if(version.patch < 9) version.patch++;
	    else if(version.patch === 9 && version.minor < 9) {version.patch = 0; version.minor++}
	    else if(version.patch === 9 && version.minor === 9 ) {version.patch = 0; version.minor = 0; version.major++;}
        return `${version.major}.${version.minor}.${version.patch}`
    }
    return '0.0.1';
}

/**
 * Checking if the pacakge exists in the relevant NPM registry
 * @param cliArguments The additional CLI arguments
 */
export async function doesPackageExist(pkgName: string, cliArguments: string): Promise<boolean> {
    const arrayArguments = cliArguments.split(' ')
    const isScopedRegistry = arrayArguments.findIndex((item: string) => item.includes('--registry') && !item.includes('registry.npmjs.org')) !== -1;
    const isScope = arrayArguments.findIndex((item: string) => item.includes('--scope')) !== -1;
    if(!isScopedRegistry && !isScope) {
        const response = await execute(`npm search ${pkgName} ${cliArguments}`);
        return response.stdout.indexOf(`No matches found for "${pkgName}"\n`) === -1;
    }
    else {
        console.log('Because of known NPM issues, we do not search for the package existence before deployment of Scoped packages.')
        return true;
    }
}

/**
 * The version object
 * @param major The major part of the version (1.x.x)
 * @param minor The minor part of the version (x.2.x)
 * @param patch The patch part of the version (x.x.3)
 */
export type Version = {
    major: number,
    minor: number,
    patch: number
}