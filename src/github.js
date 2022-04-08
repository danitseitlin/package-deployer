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
    let body = `${tagName} Release\n`;
    if(data.commits) {
        body+= extractCommitMsgFromCommits(data.commits)
    }
    console.log(`Releasing GitHub version ${tagName}`)
    console.log(body)
    if(!data.dryRun) {
        const res = await utils.execute(`curl -H 'Authorization: token ${data.token}' --data '{"tag_name": "${tagName}","target_commitish": "${data.branch}","name": "${tagName}","body": "${body}","draft": ${data.draft},"prerelease": ${data.preRelease}' https://api.github.com/repos/${data.owner}/${data.repo}/releases`)
        if(res.stdout === '')
            throw new Error(res.stderr)
    }
}
function extractCommitMsgFromCommits(commits) {
    let body = "Commits:\n";
    for(const commit of commits) {
        body += `Commited by ${commit.commit.author.name}\n`
        body += commit.commit.message
    }
    return body
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
 * Retrieving the current version of the package
 * @param {*} data The data of GitHub
 * @returns The current version of the latest GitHub release
 */
export async function getCurrentGitHubVersion(data) {
    const githubReleases = await getGitHubVersions(data.github);
    const githubRelease = githubReleases[0]
    await utils.execute(`echo "The latest github version ${JSON.stringify(githubRelease)}"`, data.debug);
    if(!githubRelease.tag_name) {
        console.debug(githubRelease)
        throw new Error('tag_name value is undefined.')
    }
    const currentVersion = githubRelease.tag_name.replace('v', '');
    return currentVersion;
}

/**
 * Deploying a GitHub release
 * @param {*} data The data of the action
 * @param {*} mainPublishVersion The main publish version. if available.
 */
export async function deployGithubRelease(data, mainPublishVersion) {
    //version, branch, draft, preRelease
    const currentVersion = mainPublishVersion ? mainPublishVersion: await getCurrentGitHubVersion(data);
    const publishVersion = utils.getNextVersion(currentVersion);
    const defaultBranch = await getDefaultBranch(data.github)
    const commitsDiff = await getBranchDiff(data.github, defaultBranch)
    
    await releaseGitHubVersion({
        owner: data.github.owner,
        repo: data.github.repo,
        token: data.github.token,
        version: publishVersion,
        branch: defaultBranch,
        draft: false,
        preRelease: false,
        debug: data.debug,
        commits: commitsDiff,
        dryRun: data.dryRun
    })
}

export async function getDefaultBranch(data) {
    if(process.env.GITHUB_BASE_REF){
        return process.env.GITHUB_BASE_REF;
    }
    const res = await utils.execute(`curl -H 'Authorization: token ${data.token}' https://api.github.com/repos/${data.owner}/${data.repo}`)
    return JSON.parse(res.stdout).default_branch
}

export async function getCurrentBranch() {
    const output = await utils.execute('git status')
    console.log(output.stdout)
}

export async function getBranchDiff(data, defaultBranch) {
    /*const defaultBranch = await getDefaultBranch(data)
    //git cherry -v master head
    const branch = await getCurrentBranch()
    console.log(process.env)
    //git log --graph --decorate --pretty=oneline --abbrev-commit master origin/master head
    const diff = await utils.execute(`git diff ${process.env.GITHUB_BASE_REF} ${process.env.GITHUB_HEAD_REF}`)
    //const diff = await utils.execute(`git cherry -v refs/${defaultBranch}`)
    return diff*/
    const currentHeadBranch = process.env.GITHUB_HEAD_REF;
    const res = await utils.execute(`curl -H 'Authorization: token ${data.token}' https://api.github.com/repos/${data.owner}/${data.repo}/compare/${defaultBranch}...${currentHeadBranch}`)
    const parsedResponse = JSON.parse(res.stdout);
    return parsedResponse.commits;
}



