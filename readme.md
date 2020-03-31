# JBlast BLAST/Galaxy - JBrowse Server Hook

[![Build Status](https://travis-ci.org/GMOD/jblast-jbconnect-hook.svg?branch=master)](https://travis-ci.org/GMOD/jblast-jbconnect-hook) [![Coverage Status](https://coveralls.io/repos/github/GMOD/jblast-jbconnect-hook/badge.svg?branch=master)](https://coveralls.io/github/GMOD/jblast-jbconnect-hook?branch=master)

Full documentation w/ Galaxy integration: [Installation & Demo Setup](http://jblast.readthedocs.io/en/latest/)

### Pre-Install
JBlast requires redis as a pre-requisite, which is only used by the queue framework (kue). JBConnect depends on Sails.js.

Install redis and sails
```
yum install redis
redis-server
npm install -g sails@1.0.2
```

### Install
Install the JBConnect and JBrowse. jb_setup.js ensures the sample data is loaded.

```
# install jbconnect
git clone http://github.com/gmod/jbconnect
cd jbconnect
npm install

# install blast tools and sample data
npm install enuggetry/blast-ncbi-tools enuggetry/faux-blastdb

# pull in NCBI blast executables
./utils/blast_getBlastUtils.js 2.8.1

# install jblast
npm install gmod/jblast-jbconnect-hook

# install jbrowse & setup jbrowse demo
npm install @gmod/jbrowse@1.15.1
patch node_modules/@gmod/jbrowse/setup.sh fix_jbrowse_setup.patch
./utils/jb_setup.js
```
The patch operation is needed to make JBrowse 1.15.1 setup.sh run properly. If JBrowse is installed in another location, the patch should be run before setup.sh.

### Run
Launch the server.

sails lift
From a web browser, access the application (default login: juser/password).

http://localhost:1337/jbrowse
