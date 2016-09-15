var requestp = require('request-promise');

/**
 * Functions for retrieving global data through rest API
 * Depends on active JBrowse server.
 * @type type
 */

module.exports = {
    url: 'http://localhost',
    port: '1337',
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