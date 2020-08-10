<p align="center"><a href="https://github.com/danitseitlin/npm-package-deployer"><img src=".github/cover-photo.png" /></a></p>
<h1 align="center">NPM Deploy bot :point_right: Automate your deployment process!</h1>
<p align="center">
  <a href="https://github.com/danitseitlin/npm-package-deployer/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/license-BSD%203%20Clause-blue.svg" />
  </a>
  <a href="https://npmjs.org/package/npm-package-deployer">
    <img src="http://img.shields.io/npm/v/npm-package-deployer.svg?style=flat" />
  </a>
</p>

## :zap: Quick Start
Run `npm install npm-package-deployer`
## :clap: Basic usage
Run `npm-deploy <package name>` to deploy an automatic version locally

## :fire: Integrate with GitHub actions
You can integrate this package with a GitHub action workflow:
1. Setup your git configuration
2. Create an .npmrc file with the NPM auth token
3. Add deploy script in your package.json for CLI npm-deploy <package name>
4. Run deploy script
A full example can be seen [here](https://github.com/danitseitlin/dmock-server/blob/master/.github/workflows/auto-deployer.yml)