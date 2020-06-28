const getVersion = require('./util').getVersion
const exec = require('await-exec')
const packageJson = require('./package.json');
(async () => {
    try {
        console.log(`Starting deployment for ${packageJson.name}`)
        const version = await getVersion(packageJson.name)
        console.log(`Upgrading to version: ${version}`)
        await exec(`npm version ${version} --allow-same-version`);
        await exec(`npm publish --dry-run`);
    } catch (e) {
        console.log(e)
    }
})();


async function getVersion(packageName) {
    if(await doesPackageExist(packageName)) {
        const stdout = (await exec(`npm info ${packageName} version`)).stdout.replace('\n', '');
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

async function doesPackageExist(packageName) {
    const response = await exec(`npm search ${packageName}`);
    return response.stdout.indexOf(`No matches found for "${packageName}"\n`) === -1;
}