/**
 * gendocs init
 * - run jsdoc
 * - run makeapi.js
 */

console.log('running gendocs_run...');
var fs = require('fs-extra');
var shelljs = require('shelljs');

var jsdoc = './node_modules/jsdoc/jsdoc.js -t node_modules/jsdoc-sphinx/template/ -d ./docs/genapi-rst ./api/**/*.js';
var makeapi = 'node makeapi.js';

shelljs.exec(jsdoc,{silent:false});
process.chdir('./docs');
//console.log('cwd',process.cwd());
shelljs.exec(makeapi,{silent:false});


