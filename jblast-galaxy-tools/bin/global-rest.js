var fs = require('fs');
var jsonfile = require('jsonfile');
var requestp = require('request-promise');

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
    setConfig: function(name,value) {
        this.checkDir();
        
        console.log('setConfig',name,value);
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
    getConfig: function(name) {
        console.log('getConfig',name);
        var contents = "{}";
        try {
            contents = fs.readFileSync(this.cfgFile);
        }
        catch(err) {
            console.log(this.cfgFile,'does not exist');
            return 'undefined';
        }
        
        var json = JSON.parse(contents);
        if (name=='') {
            return json;
        }
        if (typeof json[name] != 'undefined')
            return json[name];
        else
            return 'undefined';   // not found
    },
    /**
     * check directory 
     * @returns {undefined}
     */
    checkDir: function() {
        if (!fs.existsSync(cfgDir)){
            fs.mkdirSync(cfgDir);
        }        
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