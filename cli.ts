import * as child_process  from 'child_process';
import * as chalk from 'chalk'

export class PackageCli {
    constructor(public name: string) {}

    /**
     * Retrieving if the NPM user is currently authenticated
     */
    async isAuthenticated(): Promise<boolean> {
        try {
            await this.execute('npm whoami')
            return true
        } catch(e) {
            return false;
        }
    }
    /**
     * Retrieving the current version of the package
     * @param cliArguments The additional cli arguments
     */
    async getCurrentVersion(cliArguments: string) {
        const stdout = (await this.execute(`npm info ${this.name} version ${cliArguments}`)).stdout.replace('\n', '');
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
    async getUpgradeVersion(cliArguments: string): Promise<string> {
        if(await this.doesPackageExist(cliArguments)) {
    	    const version = await this.getCurrentVersion(cliArguments);
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
    async doesPackageExist(cliArguments: string): Promise<boolean> {
        const arrayArguments = cliArguments.split(' ')
        const isScopedRegistry = arrayArguments.findIndex((item: string) => item.includes('--registry') && !item.includes('registry.npmjs.org')) !== -1;
        const isScope = arrayArguments.findIndex((item: string) => item.includes('--scope')) !== -1;
        if(!isScopedRegistry && !isScope) {
            const response = await this.execute(`npm search ${this.name} ${cliArguments}`);
            return response.stdout.indexOf(`No matches found for "${this.name}"\n`) === -1;
        }
        else {
            console.log('Because of known NPM issues, we do not search for the package existence before deployment of Scoped packages.')
            return true;
        }
    }

    /**
     * Upgrading package to next version
     * @param cliArguments The additional CLI arguments
     */
    async upgradePackage(cliArguments: string): Promise<void> {
        const version = await this.getCurrentVersion(cliArguments);
        const updateVersion = await this.getUpgradeVersion(cliArguments);
        console.log(`Upgrading ${this.name}@${version.major}.${version.minor}.${version.patch} to version ${this.name}@${updateVersion}`)
        await this.execute(`npm version ${updateVersion} --allow-same-version ${cliArguments}`);
        const publish = await this.execute(`npm publish ${cliArguments}`);
        console.log(this.parseDeployment(publish));
    }

    private parseDeployment(publishOutput: {stdout: string, stderr: string}): publishResponse {
        const split = publishOutput.stderr.split('\n');
        const files: string[] = []
        const filesStartIndex = split.findIndex(item => item.includes('Tarball Contents'))
        const filesEndIndex = split.findIndex(item => item.includes('Tarball Details'))
        for(let i = filesStartIndex+1; i < filesEndIndex; i++) {
            files.push(split[i]);
        }
        return {
            files: files,
            name: split.find(item => item.includes('name')),
            version: split.find(item => item.includes('version')),
            size: split.find(item => item.includes('package size')),
            unpackedSize: split.find(item => item.includes('unpacked size')),
            shasum: split.find(item => item.includes('shasum')),
            integrity: split.find(item => item.includes('integrity')),
            totalFiles: split.find(item => item.includes('total files'))
        }
    }

    /**
     * Executes a shell command
     * @param command The command
     */
    async execute(command: string): Promise<{stdout: string, stderr: string}> {
        return new Promise((done, failed) => {
            child_process.exec(command, (error, stdout, stderr) => {
              if (error !== null) failed(error)
              done({ stdout, stderr })
            })
        })
    }
}

export type publishResponse = {
    name: string | undefined,
    files: string[],
    version: string | undefined,
    size: string | undefined,
    unpackedSize: string | undefined,
    shasum: string | undefined,
    integrity: string | undefined,
    totalFiles: string | undefined
}

/**
 * Printing the help message
 */
export async function printHelp(): Promise<void> {
    console.log(chalk.magenta('In order to deploy a version, run the following command:'))
    console.log(chalk.white('npm-deploy <packageName> <optional additional cli args>'))
    console.log(chalk.white('for help, run npm-deploy --help'))
    console.log(chalk.blueBright('If you liked our repo, please star it here https://github.com/danitseitlin/npm-package-deployer'))
}