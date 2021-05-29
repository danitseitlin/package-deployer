const child_process = require('child_process');

/**
 * Executing a shell command
 * @param command The command
 */
export async function execute(command) {
    return new Promise((done, failed) => {
        child_process.exec(command, (error, stdout, stderr) => {
            if (error !== null) failed(error)
            if(debug === 'true' || debug === true)
                console.log({ command, stdout, stderr })
        	done({ stdout, stderr })
        })
    })
}