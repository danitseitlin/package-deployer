const utils = require('./src/utils')
const exec = require('@actions/exec');
const core = require('@actions/core');

const github_access_token = core.getInput('github_access_token');
const npm_access_token = core.getInput('npm_access_token');
const pkg_name = core.getInput('pkg_name');
const pkg_registry = core.getInput('pkg_registry');

function configureNPM(token, registry) {
    //Creating the .npmrc file
    utils.execute(`echo "registry=${registry}" >> ~/.npmrc && echo "//${registry}:_authToken=${token}" >> ~/.npmrc`);
    //Renaming the .npmrc file so NPM will auto detect it
    utils.execute(`mv "~/.npmrc" .npmrc`);
}

function configureGitHub(pkgName) {
    utils.execute(`git config --global user.name "Deploy BOT" && git config --global user.email "bot@${pkgName}.com"`)
}

(async () => {
    configureNPM(npm_access_token, pkg_registry);
    configureGitHub(pkg_name)
    const version = await utils.getCurrentVersion(pkg_name)
    const updateVersion = await utils.getUpgradeVersion(pkg_name, pkg_registry);
    const cliArguments = `--registry=${pkg_registry}`
    console.log(`Upgrading ${pkg_name}@${version.major}.${version.minor}.${version.patch} to version ${pkg_name}@${updateVersion}`)
    await utils.execute(`npm version ${updateVersion} --allow-same-version ${cliArguments}`);
    const publish = await utils.execute(`npm publish ${cliArguments} --dry-run`);
    console.log(publish)
})();