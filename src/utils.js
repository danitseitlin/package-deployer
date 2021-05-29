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