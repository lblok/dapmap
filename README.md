# ANHD DAP Map v2.0

Developed by the Association For Neighborhood and Housing Development, Inc. (ANHD), the Displacement Alert Project (DAP) Map (http://www.dapmapnyc.org) is an important organizing, advocacy, and policy development tool that provides crucial information about recent building transactions where tenants might be facing excessive displacement pressure. The lblok/dapmap repository is the 2018 version of DAP Map being updated by Lucy Block. It builds off of https://github.com/ANHD-NYC/SAMP, which was built by <a href="https://github.com/clhenrick">@clhenrick</a> and <a href="https://github.com/jdgodchaux">@jdgodchaux</a> of <a href="http://nijel.org">NiJeL</a> (see commit history [here](https://github.com/ANHD-NYC/SAMP/commits/master)). 2023 update/rewrite away from CARTO with help from [GreenInfo Network](https://www.greeninfo.org).


## Development

### Pre-requisites

Install `nvm` first, then use that to install `Node` and `npm`, by running `nvm install 16.13.0`

* [nvm >= 0.39.1](https://github.com/nvm-sh/nvm)
* Node 16.13.0
* npm >= 8.1.0

### First Time Setup
```bash
# clone the repo 
git clone https://github.com/lblok/dapmap.git

# init the submodule
git submodule update --init --recursive

nvm use 
npm ci
```

### To Run Locally
```bash
nvm use
npm run start
```

### To Compile and Deploy to GH pages
```bash
nvm use
npm run build
# change into the submodule gh-pages, commit and push the changes to the gh-pages branch
# this triggers the build 
cd gh-pages
git add .
git commit -m 'build'
git push origin gh-pages
# then change back to the parent directory to commit the changes to the submodule
git add gh-pages
git commit -m 'build subproject'
git push origin master
```