const utils = require('./utils');
const github = require('./github');
const npm = require('./npm');

/**
 * Deploying pkg version
 */
export async function deploy(data) {
    //Configuration section
    await github.configureGitHub(data)
    if(data.npm) {
        ///await npm.configureNPM(data.npm.token, data.npm.registry);
        await npm.configureNPM({
            pkgName: data.pkgName,
            token: data.npm.token,
            registry: data.npm.registry,
            scope: data.npm.scope
        });
        //NPM Package deployment section
        const cliArguments = npm.getCliArguments(data);
        await utils.execute(`echo "args: ${cliArguments}"`, data.debug)
        const version = await npm.getCurrentVersion(data.pkgName)
        await utils.execute(`echo "current ver: ${JSON.stringify(version)}"`, data.debug)
        const updateVersion = await npm.getUpgradeVersion(data.pkgName, cliArguments);
        await utils.execute(`echo "new ver: ${updateVersion}"`, data.debug)
        console.log(`Upgrading ${data.pkgName}@${version.major}.${version.minor}.${version.patch} to version ${data.pkgName}@${updateVersion}`)
        await utils.execute(`npm version ${updateVersion} --allow-same-version${cliArguments}`, data.debug);
        const publish = await utils.execute(`npm publish${cliArguments}`, data.debug);
        console.log('==== Publish Output ====')
        if(data.prettyPrint === 'true' || data.prettyPrint === true) {
            const prettyPublish = npm.parseDeployment(publish);
            const { files, ...rest } = prettyPublish
            for(const item in rest) {
                console.log(`${item}: ${rest[item].toString()}`)
            }
            console.log(`files: ${files.toString().replace(/,/g, ', ')}`)
            console.log('========================')
        }
        else
            console.log(publish)
    }
    //GitHub Release section
    if(data.github) {
        //version, branch, draft, preRelease
        const currentVersion = (await github.getGitHubVersions())[0].tag_name.replace('v', '');
        const updateVersion = npm.getNextVersion(currentVersion);
        //await github.releaseGitHubVersion(updateVersion, 'master', false, false); //version, branch, draft, preRelease, debug, dryRun
        await github.releaseGitHubVersion({
            token: data.github.token,
            version: updateVersion,
            branch: 'master',
            draft: false,
            preRelease: false,
            debug: data.debug,
            dryRun: data.dryRun
        })
    }
}