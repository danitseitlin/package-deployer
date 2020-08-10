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
## :fire: Setup in GitHub Actions
In order to use the `npm-deploy` command in GitHub Actions we will need to add the following to the `package.json`:
```
"scripts": {
  "deploy": "npm-deploy <package name>"
}
```
Then, run `npm run deploy`
