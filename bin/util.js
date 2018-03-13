var request = require('request');
var requestp = require('request-promise');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));
var fse = require('fs-extra');
var jsonfile = require('jsonfile');
var requestp = require('request-promise');
var execSync = require('child_process').execSync;
var path = require('path');

//var config = ""; //require('../config.js');


var cfgDir = '/etc/jbrowse';

/**
 * Functions for retrieving global data through rest API
 * Depends on active JBrowse server.
 * @type type
 */

module.exports = {
    url: 'http://localhost',
    port: '1337',
    cfgFile: cfgDir+'/config.json',
    config: {},
    
    init: function(config) {
        this.config = config;
    },

    /**
     * copy src to targ, but if targ exists, it will backup the target by appending a number
     * @param {string} src source
     * @param {string} targ target
     * @returns {string} final target filename, 
     */
    safeCopy: function(src,origTarg) {
        
        var newTarg = origTarg;
        var index = 0;
        var backup = false;

        while(fse.pathExistsSync(newTarg)) {
            backup = true;
            // create new target name (inc)
            index++;
            newTarg = path.dirname(origTarg) + '/' + path.basename(origTarg, '.html') + index + '.html';
            //console.log("trying new",newTarg);
        }
        // make backup of origTarg
        if (backup)
            fse.copySync(origTarg,newTarg);
        
        // copy ssource to origTarg
        fse.copySync(src,origTarg);

        if (origTarg===newTarg) return null;
        return newTarg;
    },

    /**
     * regrieve globals by performing a REST call to the jbrowse server
     * @param {type} cb
     * @returns {undefined}
     */
    getGlobals: function (cb) {
        var reqOptions = {
            uri: this.url+':'+this.port+'/jb/globals.js',
            json: true // Automatically parses the JSON string in the response 
        };
        requestp(reqOptions)
            .then(function (repos) {
                    cb(repos);
            })
            .catch(function (err) {
                console.log(err.name,err.message);
                console.log("Is JBConnect running?");
                cb(null);
            });
    },
    setGlobals: function (data) {
        console.log("not implemented");
    },
    /* promise-ized galaxyGetJSON function
     * 
     * @param {type} api
     * @returns {Promise}
     */
    galaxyGetAsync: function(api) {
        var thisB = this;
        return new Promise(function(resolve, reject) {
            thisB.galaxyGetJSON(api, resolve, reject);
        });
    },
    /* promise-ized galaxyPostJSON function
     * 
     * @param {type} api
     * @returns {Promise}
     */
    galaxyPostAsync: function(api,params) {
        var thisB = this;
        return new Promise(function(resolve, reject) {
            thisB.galaxyPostJSON(api,params, resolve, reject);
        });
    },
    /**
     * send JSON GET request to galaxy server
     * @param {type} api - i.e. '/api/histories'
     * @param {type} cb  callback i.e. function(retval)
     * @returns {undefined}
     * 
     */
    galaxyGetJSON: function(api,cb,cberr) {
        var g = this.config;
        var gurl = g.galaxy.galaxyUrl;
        var apikey = g.galaxy.galaxyAPIKey;

        var options = {
            uri: gurl+api+"?key="+apikey,
            headers: { 'User-Agent': 'Request-Promise' },
            //resolveWithFullResponse: true,
            simple: true,
            json: true  // parse json response
        };

        //console.log("GET",options);

        requestp(options)
            .then(function (resp) {
                //console.log("Response statusCode",resp.statusCode);
                cb(resp);
            })
            .catch(function (err) {
                cberr(err);
            });
    },
    /* send JSON POST request to galaxy server
     * 
     * @param {type} api - e.g. "/api/workflows"
     * @param {type} params - json parameter i.e. {a:1,b:2}
     * @param {type} cb - callback function cb(retval)
     * 
     * retval return {status: x, data:y}
     */
    galaxyPostJSON: function(api,params,cb,cberr) {

        var g = this.config;
        var gurl = g.galaxy.galaxyUrl;
        var apikey = g.galaxy.galaxyAPIKey;

        var pstr = JSON.stringify(params);

        if(typeof apikey==='undefined') {
            cberr("missing apikey");
            return;
        }

        var req = {
            url: gurl+api+"?key="+apikey, 
            method: 'POST',
            encoding: null,
            gzip:true,
            //qs: params,
            headers: {
                'Connection': 'keep-alive',
                'Accept-Encoding' : 'gzip, deflate',
                'Accept': '*/*',
                'Accept-Language' : 'en-US,en;q=0.5',
                'Content-Length' : pstr.length
            },
            //resolveWithFullResponse: true,
            simple:true,
            json: params
        };

        //console.log(req);
        requestp(req)
            .then(function(data){
                //console.log('galaxyPost result',data);
                cb(data);
            })
            .catch(function(err){
                cberr(err);
            });

    },
    
    /**
     * create directory if it doesn't exist 
     * @returns {undefined}
     */
    checkDir: function() {
        if (!fs.existsSync(cfgDir)){
            fs.mkdirSync(cfgDir);
        }        
    },
    /**
     * execute command synchronously
     * @param {type} cmdstr
     * @returns {undefined}
     */
    cmd: function(cmdstr) {
        console.log(cmdstr);
        var result = execSync(cmdstr).toString();
        if (result.length)
            console.log(result);    

    }
}

function IsJsonString(val) {
    try {
        JSON.parse(val);
    } catch (e) {
        return false;
    }
    return true;
}
function IsJbrowseValue(val) {
    //if (!IsJsonString(val)) {
    //    throw "Invalid JSON";
    //    return false;
    //}
    if ((val.id !== 'undefined') && (val.jbrowse !== 'undefined')) {
        if (val.id===1) return true;
    }
    throw "Invalid global data";
    return false;
}
