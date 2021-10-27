const utils = require('./utils');

/**
 * Configurating GitHub
 * @param {*} pkgName The name of the pkg
 */
export async function configureGitHub(pkgName) {
    await utils.execute(`git config --global user.name "Deploy BOT" && git config --global user.email "bot@${pkgName}.com"`)
}

/**
 * Releasing a new GitHub release
 * @param {*} data The data of the GitHub release
 */
export async function releaseGitHubVersion(data) {
    const tagName = `v${data.version}`;
    const body = `Release of ${tagName}`;
    console.log(`Releasing GitHub version ${tagName}`)
    if(!data.dryRun) {
        const res = await utils.execute(`curl -H 'Authorization: token ${data.token}' --data '{"tag_name": "${tagName}","target_commitish": "${data.branch}","name": "${tagName}","body": "${body}","draft": ${data.draft},"prerelease": ${data.preRelease}' https://api.github.com/repos/${data.owner}/${data.repo}/releases`)
        if(res.stdout === '')
            throw new Error(res.stderr)
    }
}

/**
 * Retrieving all the GitHub versions
 * @param {*} data The data of GitHub
 * @returns An array object of the GitHub releases
 */
export async function getGitHubVersions(data) {
    const res = (await utils.execute(`curl -H 'Authorization: token ${data.token}' https://api.github.com/repos/${data.owner}/${data.repo}/releases`)).stdout;
    return JSON.parse(res)
}

/**
 * 
 * @param {*} data 
 * @returns 
 */
export async function getCurrentVersion(data) {
    const githubResponse = (await github.getGitHubVersions(data))[0]
    if(!githubResponse.tag_name) {
        console.debug(githubResponse)
        throw new Error('tag_name value is undefined.')
    }
    const currentVersion = githubResponse.tag_name.replace('v', '');
    return currentVersion;
}