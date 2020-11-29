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
    async getCurrentVersion(cliArguments: string): Promise<Version> {
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
    async upgradePackage(cliArguments: string): Promise<PublishResponse> {
        const version = await this.getCurrentVersion(cliArguments);
        const updateVersion = await this.getUpgradeVersion(cliArguments);
        console.log(`Upgrading ${this.name}@${version.major}.${version.minor}.${version.patch} to version ${this.name}@${updateVersion}`)
        await this.execute(`npm version ${updateVersion} --allow-same-version ${cliArguments}`);
        const publish = await this.execute(`npm publish ${cliArguments}`);
        const prettyPublish = this.parseDeployment(publish);
        if(cliArguments.includes('--publish-original-output'))
            console.log(publish)
        if(cliArguments.includes('--publish-pretty-output')) {
            console.log('==== Publish Output ====')
            const { files, ...rest } = prettyPublish
            console.log(`files: ${files.toString().replace(/,/g, ', ')}`)
            for(const item in rest) {
                console.log(`${item}: ${rest[item].toString()}`)
            }
            console.log('========================')
        }
        return prettyPublish;
    }

    /**
     * Parsing the publish output to a more pretified version
     * @param output The publish output
     */
    private parseDeployment(output: {stdout: string, stderr: string}): PublishResponse {
        const split = output.stderr.split('\n');
        const name = split.find(item => item.includes('name'))
        const version = split.find(item => item.includes('version'))
        const size = split.find(item => item.includes('package size'))
        const unpackedSize = split.find(item => item.includes('unpacked size'))
        const shasum = split.find(item => item.includes('shasum'))
        const integrity = split.find(item => item.includes('integrity'))
        const totalFiles = split.find(item => item.includes('total files'))
        const files: string[] = []
        const filesStartIndex = split.findIndex(item => item.includes('Tarball Contents'))
        const filesEndIndex = split.findIndex(item => item.includes('Tarball Details'))

        //Parsing only the files
        for(let i = filesStartIndex+1; i < filesEndIndex; i++) {
            files.push(split[i].split('B ')[1].replace(/ /g, '').replace('\n', ''));
        }
        //Building and returning the rest of the JS object
        return {
            files: files,
            name: (name !== undefined) ? name.replace(/  /g, '').split(':')[1]: null,
            version: (version !== undefined) ? version.replace(/  /g, '').split(': ')[1].replace(/ /g, ''): null,
            size: (size !== undefined) ? size.replace(/  /g, '').split(':')[1]: null,
            unpackedSize: (unpackedSize !== undefined) ? unpackedSize.replace(/  /g, '').split(': ')[1].replace(/ /g, ''): null,
            shasum: (shasum !== undefined) ? shasum.replace(/  /g, '').split(':')[1]: null,
            integrity: (integrity !== undefined) ? integrity.replace(/  /g, '').split(': ')[1]: null,
            totalFiles: (totalFiles !== undefined) ? parseInt(totalFiles.replace(/  /g, '').split(': ')[1]): null,
        }
    }

    /**
     * Executing a shell command
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

/**
 * Printing the help message
 */
export async function printHelp(): Promise<void> {
    console.log(chalk.magenta('In order to deploy a version, run the following command:'))
    console.log(chalk.white('npm-deploy <packageName> <optional additional cli args>'))
    console.log(chalk.white('additional parameters:'))
    console.log(chalk.white('--publish-original-output | Printing the original publish output'))
    console.log(chalk.white('--publish-pretty-output | Printing a pretified publish output'))
    console.log(chalk.white('for help, run npm-deploy --help'))
    console.log(chalk.blueBright('If you liked our repo, please star it here https://github.com/danitseitlin/npm-package-deployer'))
}

/**
 * The publish response object
 * @param name The name of the package
 * @param files A list of files that we're deployed
 * @param version The version of the package (after the update)
 * @param size The size of the package (after the update)
 * @param unpackedSize The unpacked size of the package (after the update)
 * @param shasum The shasum of the package
 * @param integrity The integrity of the package
 * @param totalFiles The total files deployed of the package
 */
export type PublishResponse = {
    name: string | null,
    files: string[],
    version: string | null,
    size: string | null,
    unpackedSize: string | null,
    shasum: string | null,
    integrity: string | null,
    totalFiles: number | null,
    [key: string]: any
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