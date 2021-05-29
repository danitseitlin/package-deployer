const utils = require('./utils');
const github = require('@actions/github');

/**
 * Configurating GitHub
 * @param {*} pkgName The name of the pkg
 */
export async function configureGitHub(pkgName) {
    await utils.execute(`git config --global user.name "Deploy BOT" && git config --global user.email "bot@${pkgName}.com"`)
}

/**
 * Releasing a new GitHub release
 * @param {*} tagName The release version
 * @param {*} branch The branch to release from
 * @param {*} draft If the release is a draft
 * @param {*} preRelease If the release is a pre-release
 */
export async function releaseGitHubVersion(data) {
    const tagName = `v${data.version}`;
    const body = `Release of v${tagName}`;
    if(data.debug)
        console.log(`Releasing GitHub version ${tagName}`)
    if(!data.dryRun)
        await utils.execute(`curl -H 'Authorization: token ${data.token}' --data '{"tag_name": "${tagName}","target_commitish": "${data.branch}","name": "${tagName}","body": "${body}","draft": ${data.draft},"prerelease": ${data.preRelease}' https://api.github.com/repos/${github.context.repo.owner}/${github.context.repo.repo}/releases`)
}

/**
 * Retrieving all the GitHub versions
 * @returns An array object of the GitHub releases
 */
export async function getGitHubVersions() {
    const res = (await utils.execute(`curl https://api.github.com/repos/${github.context.repo.owner}/${github.context.repo.repo}/releases`)).stdout;
    return JSON.parse(res)
}