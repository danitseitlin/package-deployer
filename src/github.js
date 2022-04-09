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
    let body = '';
    if(data.commits && data.commits.length > 0) {
        const commitsByAuthor = getCommitsByAuthor(data.commits)
        body+= buildBodyCommitMessage(commitsByAuthor)
    }
    
    if(!data.dryRun) {
        const req = {
            "tag_name": tagName,
            "target_commitish": data.branch,
            "name": tagName,
            "body": body,
            "draft": data.draft,
            "prerelease": data.preRelease
        }
        console.log(`Releasing GitHub version ${tagName}`)
        const res = await utils.execute(`curl -H 'Authorization: token ${data.token}' --data '${JSON.stringify(req)}' https://api.github.com/repos/${data.owner}/${data.repo}/releases`, data.debug)
        if(res.stdout === '')
            throw new Error(res.stderr)
    }
}
function getCommitsByAuthor(commits) {
    const commitsByAuthor = []
    for(const commit of commits) {
        const author = commit.commit.author.name;
        let message = commit.commit.message;
        if(message.indexOf('\n') != -1){
            message = message.split('\n')[0]
        }
        commitsByAuthor.push({
            author: author,
            message: message
        })
    }
    return commitsByAuthor
}
function buildBodyCommitMessage(commitsByAuthor) {
    let body = "<h2>Commits:</h2>\n";
    for(const commit of commitsByAuthor) {
        body += `${commit.message} by @${commit.author}\n`
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
    await utils.execute(`echo 'The latest github version ${JSON.stringify(githubRelease)}'`, data.debug);
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
    const defaultBranch = await getDefaultBranch(data)
    const commitsDiff = await getBranchDiff(data, defaultBranch)
    
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

/**
 * Retrieving the default branch of the repo, if the ENV parameters GITHUB_BASE_REF exists, we would use it.
 * Else we would obtain the default_branch via GitHub API
 * @param {*} data The data of the action
 * @returns The default base branch of the repo
 */
export async function getDefaultBranch(data) {
    if(process.env.GITHUB_BASE_REF){
        return process.env.GITHUB_BASE_REF;
    }
    const res = await utils.execute(`curl -H 'Authorization: token ${data.github.token}' https://api.github.com/repos/${data.github.owner}/${data.github.repo}`, data.debug)
    return JSON.parse(res.stdout).default_branch
}

/**
 * Retrieving the commit diffs of current branch and default branch
 * @param {*} data The data of the action
 * @param {*} defaultBranch The default branch of the repo
 * @returns The commit diffs between 2 branches
 */
export async function getBranchDiff(data, defaultBranch) {
    const currentHeadBranch = process.env.GITHUB_HEAD_REF;
    //In case we do not have a Github HEAD REF
    if(!currentHeadBranch || currentHeadBranch == null) {
        return (await getBranchViaLastRelease(data, defaultBranch)).commits;
    }
    return (await getBranchDiffViaHeadRef(data, defaultBranch, currentHeadBranch)).commits;
}

/**
 * Retrieving branch diff between 2 branches
 * @param {*} data The data of the action 
 * @param {*} defaultBranch The default branch
 * @param {*} headRefBranch The HEAD REF branch
 * @returns All the info regarding the diff
 */
export async function getBranchDiffViaHeadRef(data, defaultBranch, headRefBranch) {
    const res = await utils.execute(`curl -H 'Authorization: token ${data.github.token}' https://api.github.com/repos/${data.github.owner}/${data.github.repo}/compare/${defaultBranch}...${headRefBranch}`, data.debug)
    return JSON.parse(res.stdout);
}

/**
 * Retrieving branch diff between default branch and latest release
 * @param {*} data The data of the action 
 * @param {*} defaultBranch The default branch
 * @returns All the info regarding the diff
 */
export async function getBranchViaLastRelease(data, defaultBranch) {
    const releases = await getGitHubVersions(data.github);
    if(releases.length === 0) {
        return {
            'commits': []
        };
    }
    const latestRelease = releases[0];
    return await getBranchDiffViaHeadRef(data, latestRelease.tag_name, defaultBranch);
}