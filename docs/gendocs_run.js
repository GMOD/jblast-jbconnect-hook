/**
 * gendocs init
 * - run jsdoc
 * - run makeapi.js
 */
var fs = require('fs-extra');
var shelljs = require('shelljs');

var jsdoc = './node_modules/jsdoc/jsdoc.js -t node_modules/jsdoc-sphinx -d ./docs/genapi-rst ./api/**/*.js ./api/hooks/jblast/*.js --verbose';
var makeapi = 'node makeapi.js';

// remove genapi-rst/*.rst files
console.log("deleting ./docs/genapi-rst/*.rst");
shelljs.exec('rm -f -v ./docs/genapi-rst/*.rst',{silent:false});

// run jsdoc
console.log("running jsdoc");
shelljs.exec(jsdoc,{silent:false});

// run makeapi
process.chdir('./docs');
console.log('running makeapi, cwd',process.cwd());
shelljs.exec(makeapi,{silent:false});


