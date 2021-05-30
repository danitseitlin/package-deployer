const child_process = require('child_process');

/**
 * Executing a shell command
 * @param command The command
 * @param isDebug If to print extra debug logs. Default: false
 */
export async function execute(command, isDebug = false) {
    return new Promise((done, failed) => {
        child_process.exec(command, (error, stdout, stderr) => {
            if (error !== null) failed(error)
            if(isDebug === 'true' || isDebug === true)
                console.log({ command, stdout, stderr })
        	done({ stdout, stderr })
        })
    })
}

/**
 * Converting string value to boolean
 * @param {*} value The value given to convert to boolean
 * @returns A boolean
 */
export function stringToBoolean(value) {
    return (value === 'false' || value === undefined) ? false: true;
}

/**
 * Printing the help message
 */
export async function printHelp() {
    console.log(chalk.magenta('In order to deploy a version, run the following command:'))
    console.log(chalk.white('deploy-pkg <packageName> <optional additional cli args>'))
    console.log(chalk.white('additional parameters:'))
    console.log(chalk.white('--publish-original-output | Printing the original publish output'))
    console.log(chalk.white('--publish-pretty-output | Printing a pretified publish output'))
    console.log(chalk.white('for help, run deploy-pkg --help'))
    console.log(chalk.blueBright('If you liked our repo, please star it here https://github.com/danitseitlin/npm-package-deployer'))
}