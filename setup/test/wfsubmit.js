var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));
var requestp = require('request-promise');
var path = require('path');
var getopt = require('node-getopt');
var util = require('../bin/util.js');
var config = require('../config.js');

getHistory(function(hId) {
    console.log("getHistory() history id",hId);

    var f = 'http://localhost:1337/jbrowse/sample_data/json/volvox/jblastdata/blastme.fa';
    //var f = '/var/www/html/jbrowse/sample_data/json/volvox/jblastdata/blastme.fa';
    
    //sendFile(f,hId,function(fileData){
        //console.log("file id",fileData.outputs[0].id);
        var fileId = '63cd3858d057a6d1';
        doWorkflow(fileId,hId);
    //});
});
function doWorkflow(fileId,hId) {
    console.log("doWorkflow()");
    getWorkflow('JBlast WF3',function(wfid) {
       console.log('workflow id',wfid); 
       
       doWorkflowSubmit(fileId,hId,wfid);
       
    });
}
function doWorkflowSubmit(fileId,hId,wfid) {
    console.log("doWorkflowSubmit()");
    util.galaxyGetJSON('/api/workflows/'+wfid,function(data) {
       console.log("doWorkflowSubmit output "+JSON.stringify(data, null, 4));
       
        var params =  {
            "workflow_id": wfid, 
            "ds_map": {
                "0": {
                    "src": "hda", 
                    "id": fileId
                }
            }, 
            "history": "hist_id="+hId
        };      
        
        console.log("pre submit",JSON.stringify(params, null, 4));
        
        util.galaxyPostJSON('/api/workflows',params,function(data) {
            console.log("POST /api/workflows "+JSON.stringify(data, null, 4));
        }); 
    });
}

//-----------------------------------------------------------------
function getHistory(cb) {
    util.galaxyGetJSON('/api/histories',function(data) {
       if (data.status==='error') {
           return;
       } 
       //console.log(data.data); 
       var data = data.data;
       var found = 0;
       var histName = config.galaxy.historyName;
       for(var i in data) {
           if (data[i].name.indexOf(histName) !== -1) {
               //console.log('History already exists: ', data[i].name);
               //console.log(data[i],data[i].url);
               cb(data[i].id);
               return;
           }
       }
       
    });
}

function sendFile(theFile,hId, cb) {
    var params = 
    {
            "tool_id": "upload1",
            "history_id": hId,   // must reference a history
            "inputs": {
  
                "dbkey":"?",
                "file_type":"auto",
                "files_0|type":"upload_dataset",
                "files_0|space_to_tab":null,
                "files_0|to_posix_lines":"Yes",
                "files_0|url_paste":theFile,
                "name":"hello"
            }
    };
    util.galaxyPostJSON('/api/tools',params,function(data) {
       if (data.status==='success') {
          //console.log(data.data);
          cb(data.data);
       }
       else
          console.log(data.data);
    });
    
}

function getWorkflow(wfname,cb) {
    
    util.galaxyGetJSON('/api/workflows',function(data) {
       if (data.status==='error') {
           return;
       } 
       //console.log(data.data); 
       var data = data.data;
       var found = 0;
       for(var i in data) {
           if (data[i].name.indexOf(wfname) !== -1) {
               cb(data[i].id);
               return;
           }
       }
    });
}
