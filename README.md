<p style='width:100%'><p align='center'><a href='https://github.com/danitseitlin/npm-package-deployer'><img src='.github/resources/cover-photo.png' /></a></p>
<h1 align='center'>NPM Deploy bot <g-emoji class='g-emoji' alias='point_right' fallback-src='https://github.githubassets.com/images/icons/emoji/unicode/1f449.png'>👉</g-emoji> Automate your deployment process!</h1>
<p align='center'>
  <a href='https://www.npmjs.com/package/npm-package-deployer'>
    <img src='https://img.shields.io/npm/v/npm-package-deployer/latest?style=plastic' target='_blank' />
  </a>
  <a href='https://npmjs.org/package/npm-package-deployer' style='width:25px;height:20px;'>
    <img src='https://img.shields.io/npm/dm/npm-package-deployer.svg?color=blue&style=plastic' target='_blank' />
  </a>
  <a href='https://github.com/danitseitlin/npm-package-deployer/issues' style='width:25px;height:20px;'>
    <img src='https://img.shields.io/github/issues/danitseitlin/npm-package-deployer?style=plastic' target='_blank' />
  </a>
  <a href='https://npmjs.org/package/npm-package-deployer' style='width:25px;height:20px;'>
    <img src='https://img.shields.io/bundlephobia/min/npm-package-deployer/latest?style=plastic' target='_blank' />
  </a>
  <a href='https://github.com/danitseitlin/npm-package-deployer/commits/master'>
    <img src='https://img.shields.io/github/last-commit/danitseitlin/npm-package-deployer?style=plastic' />
  </a>
  <a href='https://github.com/danitseitlin/npm-package-deployer/blob/master/LICENSE'>
    <img src='https://img.shields.io/badge/license-BSD%203%20Clause-blue.svg?style=plastic' target='_blank' />
  </a>
  <a href='https://dev.to/danitseitlin/simple-deploybot-npm-package-494f'>
    <img src='.github/resources/dev-logo.png' target='_blank' />
  </a>
</p></p><p align='center'><img src='.github/resources/cli.gif'/></p>

## :zap: Quick Start
Run `npm install npm-package-deployer`
## :clap: Basic usage
Run `deploy-pkg <package name>` to deploy an automatic version locally. Here are available flags:

| CLI argument          | Explanation                                                       |
|---------------------- |------------------------------------------------------------------ |
| --npm-access-token    | The NPM access token. Required for NPM package deployments.       |
| --npm-registry        | The NPM registry. Default: registry.npmjs.org                     |
| --npm-scope           | The NPM scope. The scope of the NPM package. Default: ''          |
| --github-access-token | The GitHub access token. Required for GitHub release deployments. |
| --github-owner        | The GitHub owner. Required for GitHub release deployments.        |
| --github-repo         | The GitHub repo. Required for GitHub release deployments.         |
| --pretty-print        | Printing data in a more "readable" format                         |
| --debug               | If to print debug logs                                            |
| --dry-run             | If to release packages in a dry run                               |

## :fire: Integrate with GitHub actions
You can integrate this package with a GitHub action workflow (A full example can be seen [here](https://github.com/danitseitlin/dmock-server/blob/master/.github/workflows/auto-deployer.yml)):
1. Setup your git configuration
2. Create an .npmrc file with the NPM auth token
3. Add deploy script in your package.json for `deploy-pkg <package name>`
4. Run deploy script

<p align='center'><img src='.github/resources/deploybot.gif'/></p>
