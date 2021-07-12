const utils = require('./utils');
const github = require('./github');
const npm = require('./npm');

/**
 * Deploying pkg version
 * @param {*} data The data passed to the deployment
 */
export async function deploy(data) {
    //Configuration section
    await github.configureGitHub(data.pkgName)
    if(data.npm) {
        let pkgName = data.pkgName;
        if(data.npm.scope && data.npm.scope !== '')
            pkgName = `@${data.npm.scope}/${data.pkgName}`
        await npm.configureNPM({
            token: data.npm.token,
            registry: data.npm.registry,
            scope: data.npm.scope,
            workingDirectory: data.workingDirectory,
            debug: data.debug
        });
        //NPM Package deployment section
        const cliArguments = npm.getCliArguments(data);
        await utils.execute(`echo "args: ${cliArguments}"`, data.debug)
        const currentVersion = await npm.getCurrentVersion(pkgName, data.workingDirectory)
        await utils.execute(`echo "current ver: ${JSON.stringify(currentVersion)}"`, data.debug)
        const updateVersion = npm.getNextVersion(currentVersion) //await npm.getUpgradeVersion(pkgName, cliArguments);
        await utils.execute(`echo "new ver: ${updateVersion}"`, data.debug)
        console.log(`Upgrading ${pkgName}@${currentVersion} to version ${pkgName}@${updateVersion}`)
        await utils.execute(`cd ${data.workingDirectory} && ls && npm version ${updateVersion} --allow-same-version${cliArguments}`, data.debug);
        const publish = await utils.execute(`cd ${data.workingDirectory} && npm publish${cliArguments}`, data.debug);
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
        const githubResponse = (await github.getGitHubVersions(data.github))[0]
        console.log(githubResponse)
        if(!githubResponse.tag_name) {
            console.debug(githubResponse)
            throw new Error('tag_name value is undefined.')
        }
        const currentVersion = githubResponse.tag_name.replace('v', '');
        const updateVersion = npm.getNextVersion(currentVersion);
        await github.releaseGitHubVersion({
            owner: data.github.owner,
            repo: data.github.repo,
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