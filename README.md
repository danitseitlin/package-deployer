# NPM Package Deployer &middot; [![GitHub license](https://img.shields.io/badge/license-BSD%203%20Clause-blue.svg)](https://github.com/danitseitlin/npm-package-deployer/blob/master/LICENSE) [![npm version](http://img.shields.io/npm/v/npm-package-deployer.svg?style=flat)](https://npmjs.org/package/npm-package-deployer "View this project on npm") 
## About
A useful Node JS tool for deploying NPM Version automatically
## Quick Start
Run `npm install npm-package-deployer`
## Basic usage
Run `npm-deploy <package name>` to deploy an automatic version locally
## Setup in GitHub Actions
In order to use the `npm-deploy` command in GitHub Actions we will need to add the following to the `package.json`:
```
"scripts": {
  "deploy": "npm-deploy <package name>"
}
```
Then, run `npm run deploy`
