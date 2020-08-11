<p align='center'><a href='https://github.com/danitseitlin/npm-package-deployer'><img src='.github/resources/cover-photo.png' /></a></p>
<h1 align='center'>NPM Deploy bot <g-emoji class='g-emoji' alias='point_right' fallback-src='https://github.githubassets.com/images/icons/emoji/unicode/1f449.png'>👉</g-emoji> Automate your deployment process!</h1>
<p align='center'>
  <a href='https://github.com/danitseitlin/npm-package-deployer/blob/master/LICENSE'>
    <img src='https://img.shields.io/badge/license-BSD%203%20Clause-blue.svg' target='_blank' />
  </a>
  <a href='https://npmjs.org/package/npm-package-deployer'>
    <img src='http://img.shields.io/npm/v/npm-package-deployer.svg?style=flat' target='_blank' />
  </a>
  <a href='https://npmjs.org/package/npm-package-deployer' style='width:25px;height:20px;'>
    <img src='https://img.shields.io/npm/dm/npm-package-deployer.svg?color=blue' target='_blank' />
  </a>
  <a href='https://npmjs.org/package/npm-package-deployer' style='width:25px;height:20px;'>
    <img src='https://img.shields.io/bitbucket/issues/danitseitlin/npm-package-deployer' target='_blank' />
  </a>
  <a href='https://dev.to/danitseitlin/simple-deploybot-npm-package-494f'>
    <img src='https://cdn4.iconfinder.com/data/icons/logos-and-brands-1/512/84_Dev_logo_logos-512.png' width='25' height='20' target='_blank' />
  </a>
</p>

<p align='center'><img src='.github/resources/cli.gif'/></p>

## :zap: Quick Start
Run `npm install npm-package-deployer`
## :clap: Basic usage
Run `npm-deploy <package name>` to deploy an automatic version locally

## :fire: Integrate with GitHub actions
You can integrate this package with a GitHub action workflow (A full example can be seen [here](https://github.com/danitseitlin/dmock-server/blob/master/.github/workflows/auto-deployer.yml)):
1. Setup your git configuration
2. Create an .npmrc file with the NPM auth token
3. Add deploy script in your package.json for `npm-deploy <package name>`
4. Run deploy script

<p align='center'><img src='.github/resources/deploybot.gif'/></p>
