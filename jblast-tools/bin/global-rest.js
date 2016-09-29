var fs = require('fs');
var request = require('request');
var jsonfile = require('jsonfile');
var requestp = require('request-promise');
var execSync = require('child_process').execSync;
var globals = require('../globals.js');

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


    /**
     * 
     * @param {type} cb
     * @returns {undefined}
     */
    getGlobals: function (cb) {

        var reqOptions = {
            uri: this.url+':'+this.port+'/jbglobal/1',
            json: true // Automatically parses the JSON string in the response 
        };

        requestp(reqOptions)
            .then(function (repos) {
                if (IsJbrowseValue(repos))
                    cb(repos.jbrowse);
                else
                    cb({result:'error',error:'global.js: invalid JSON'})
            })
            .catch(function (err) {
                cb({result:'error',error:err});
            });
    },
    setGlobals: function (data) {
        
    },
    test: function(){
        console.log("test output");
    },
    /**
     * Set config value
     * @param {type} name
     * @param {type} value
     * @returns return 1 if failed, 0 success
     */
    x_setConfig: function(name,value) {
        this.checkDir();
        
        //console.log('setConfig',name,value);
        var contents = "{}";
        try {
            contents = fs.readFileSync(this.cfgFile);
        }        
        catch(err) {
            console.log(this.cfgFile, 'does not exist');
        }
        var json = JSON.parse(contents);
        json[name] = value;
        var str = JSON.stringify(json);
        try {
            fs.writeFileSync(this.cfgFile, str);
        }
        catch(err) {
            console.log("ERROR:",err);
            return 1;   // failed
        }
        console.log(this.cfgFile,"written",str);
        return 0;   // success
    },
    /**
     * Get config value given name
     * @param {type} name
     * @returns value or 0 if does not exist
     */
    x_getConfig: function(name) {
        //console.log('getConfig',name);
        var contents = "{}";
        try {
            contents = fs.readFileSync(this.cfgFile);
        }
        catch(err) {
            console.log(this.cfgFile,'does not exist');
            return 'undefined';
        }
        
        var json = JSON.parse(contents);
        if (name==='') {
            return JSON.stringify(json,null,2);
        }
        if (typeof json[name] !== 'undefined')
            return json[name];
        else
            return 'undefined';   // not found
    },
    /* send JSON POST request
     * 
     * @param {type} api - e.g. "/api/workflows"
     * @param {type} params - json parameter i.e. {a:1,b:2}
     * @param {type} cb - callback function cb(error,response,body)
     */
    galaxyPostJSON: function(api,params,cb) {
        
        var jsonstr = JSON.stringify(params);
        //var apikey = this.getConfig("apikey");
        //var gurl = this.getConfig("gurl");

        var gurl = globals.galaxy.galaxyUrl;
        var apikey = globals.galaxy.galaxyAPIKey;
        
        
        if(typeof apikey=='undefined') {
            console.log("missing apikey");
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
                'Content-Length' : jsonstr.length
            },
            json: params
        };
        
        console.log(req);
        
        request.post(req, function(err, response, body){
            if (err || response.statusCode != 200) {
                console.log("response.statusCode",response.statusCode);
                if (response.statusCode==403) console.log("possible invalid apikey", apikey);
                if (err) console.log("Error:",err);
            }
            cb(err,response,body);
        });
        
    },
    /**
     * check directory 
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