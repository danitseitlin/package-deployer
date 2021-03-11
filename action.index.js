const exec = require('@actions/exec');
const core = require('@actions/core');
const child_process = require('child_process');

const github_access_token = core.getInput('github_access_token');
const npm_access_token = core.getInput('npm_access_token');
const pkg_name = core.getInput('pkg_name');
const pkg_registry = core.getInput('pkg_registry');

function configureNPM(token, registry) {
    //Creating the .npmrc file
    execute(`echo "registry=${registry}" >> ~/.npmrc && echo "//${registry}:_authToken=${token}" >> ~/.npmrc`);
    //Renaming the .npmrc file so NPM will auto detect it
    execute(`ls -a || mv "~:.npmrc" .npmrc`);
}

function configureGitHub(pkgName) {
    execute(`git config --global user.name "Deploy BOT" && git config --global user.email "bot@${pkgName}.com"`)
}

/**
 * Executing a shell command
 * @param command The command
 */
 async function execute(command) {
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
 async function getCurrentVersion(pkgName) {
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
 async function getUpgradeVersion(pkgName, registry) {
    if(await doesPackageExist(pkgName, registry)) {
	    const version = await getCurrentVersion(pkgName);
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
 async function doesPackageExist(pkgName, cliArguments) {
    const arrayArguments = cliArguments.split(' ')
    const isScopedRegistry = arrayArguments.findIndex((item) => item.includes('--registry') && !item.includes('registry.npmjs.org')) !== -1;
    const isScope = arrayArguments.findIndex((item) => item.includes('--scope')) !== -1;
    if(!isScopedRegistry && !isScope) {
        const response = await execute(`npm search ${pkgName} ${cliArguments}`);
        return response.stdout.indexOf(`No matches found for "${pkgName}"\n`) === -1;
    }
    else {
        console.log('Because of known NPM issues, we do not search for the package existence before deployment of Scoped packages.')
        return true;
    }
}

(async () => {
    configureNPM(npm_access_token, pkg_registry);
    configureGitHub(pkg_name)
    const version = await getCurrentVersion(pkg_name)
    const updateVersion = await getUpgradeVersion(pkg_name, pkg_registry);
    const cliArguments = `--registry=${pkg_registry}`
    console.log(`Upgrading ${pkg_name}@${version.major}.${version.minor}.${version.patch} to version ${pkg_name}@${updateVersion}`)
    await execute(`npm version ${updateVersion} --allow-same-version ${cliArguments}`);
    const publish = await execute(`npm publish ${cliArguments} --dry-run`);
    console.log(publish)
})();