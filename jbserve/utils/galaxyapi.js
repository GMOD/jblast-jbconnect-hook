console.log("Galaxy API Test...");

var request = require('request');
var prettyjson = require('prettyjson');
//var prompt = require('prompt');
var fs = require('fs');
var getopt = require('node-getopt');

// enables http debugging
//require('request-debug')(request);  


// api key on local
var galaxyUrl = "http://192.168.56.102:8080";
var apiKey = "2bb67717b99a37e92e59003f93625c9b";


// enables http debugging
//require('request-debug')(request);  




var opt = getopt.create([
    ['c' , 'cmd=STRING'            , 'command'],
    ['v' , 'value=STRING'            , 'value'],
    ['f' , 'file=PATH'            , 'file'],
    ['i' , 'index=STRING'            , 'index'],
    
    ['h' , 'help'            , 'display this help']
])              // create Getopt instance
.bindHelp()     // bind option 'help' to default action
.parseSystem(); // parse command line





var cmd = opt.options['cmd'];
console.log('cmd',cmd);
switch(cmd) {
    // galaxyapi.js --cmd list-hist   - list the histories
    // galaxyapi.js --cmd list-hist -index 1
    case "list-hist":
        showHistories();
    break;
    case "get-hist":
        var i = opt.options['index'];
        console.log("index",i);
        showHistories(i);
    break;
    case "submit-workflow":
        var f = opt.options['file'] || ".";
        //importFiles(function(result) {
            //console.log(JSON.stringify(result.outputs,null,2));
            
            var ds_map = {};
            ds_map[0] = {
                    src: 'hda',
                    id: 'test.out'//result.outputs[0].id
                };
            
            //console.log(JSON.stringify(ds_map,null,2));
            
            executeWorkflow(ds_map);
        //});
    break;
    default:
        console.log("invalid options");
        break;
}


var pOptions = {
  keysColor: 'yellow',
  dashColor: 'magenta',
  stringColor: 'white'
};
// executeWorkflow
function executeWorkflow(dsmap) {
    console.log('executeWorkflow');
    var params = {
        workflow_id: 'f2db41e1fa331b3e',
        history: 'hist_id=f597429621d6eb2b',
        ds_map: dsmap
    };
    var jsonstr = JSON.stringify(params);
    
    var data = {
        url: galaxyUrl+"/api/workflows"+"?key="+apiKey, 
        method: 'POST',
        //qs: params,
        headers: {
            //'Content-Type': 'application/json',
            //'Accept':'application/json, text/javascript, */*; q=0.01',
            'Accept-Encoding' : 'gzip, deflate',
            'Accept-Language' : 'en-US,en;q=0.5',
            'Content-Length' : jsonstr.length
            //'Referrer':galaxyUrl,
            //'X-Requested-With':'XMLHttpRequest'
        },
        json: params
    };
    console.log (JSON.stringify(data,null,2));
    
    request.post(data, function(error, response, result){
        if(error) {
            console.log(error);
        } else {
            console.log(response.statusCode);
            console.log(JSON.stringify(result,null,2));
        }
    });

}

// fetch file(s) from url (import file into galaxy)
function importFiles(postFn) {
    console.log('importFiles()');
    var params = 
    {
            "tool_id": "upload1",
            "history_id": "f597429621d6eb2b",   // must reference a history
            "inputs": {
  
                "dbkey":"?",
                "file_type":"auto",
                "files_0|type":"upload_dataset",
                "files_0|space_to_tab":null,
                "files_0|to_posix_lines":"Yes",
                "files_0|url_paste":"http://localhost/MyFiles/myctgA-17400..23000.fasta"
                //"files_0|url_paste":"http://localhost/MyFiles/myvolvox.fa\nhttp://localhost/MyFiles/myctgA-17400..23000.fasta"
            }
    };  
    var jsonstr = JSON.stringify(params);

    var data = {
        url: galaxyUrl+"/api/tools"+"?key="+apiKey, 
        method: 'POST',
        //qs: params,
        headers: {
            //'Content-Type': 'application/json',
            //'Accept':'application/json, text/javascript, */*; q=0.01',
            'Accept-Encoding' : 'gzip, deflate',
            'Accept-Language' : 'en-US,en;q=0.5',
            'Content-Length' : jsonstr.length
            //'Referrer':galaxyUrl,
            //'X-Requested-With':'XMLHttpRequest'
        },
        json: params
    };

    request.post(data, function(error, response, body){
        if(error) {
            console.log(error);
        } else {
            //console.log(response.statusCode);
            result = body;
            //var result = JSON.parse(body);
            postFn(result);
        }
    });    
    
}

// run NCBI Blast+ with two fixed fasta files
function execTool_blastPlus(){
    console.log('execTool_blastPlus()');
    
    var params = 
    {
            "tool_id": "toolshed.g2.bx.psu.edu/repos/devteam/ncbi_blast_plus/ncbi_blastp_wrapper/0.1.07",
            "tool_version": "0.1.07",
            "history_id": "f597429621d6eb2b",   // must reference a history
            "inputs": {
                    "query": {
                            "batch": false,
                            "values": [{
                                    "src": "hda",
                                    "hid": 1,
                                    "id": "f2db41e1fa331b3e",
                                    "name": "test ctgA-17400..23000 (+ strand).fasta"
                            }]
                    },
                    "db_opts|db_opts_selector": "file",
                    "db_opts|database": "",
                    "db_opts|histdb": "",
                    "db_opts|subject": {
                            "batch": false,
                            "values": [{
                                    "src": "hda",
                                    "hid": 2,
                                    "id": "f597429621d6eb2b",
                                    "name": "volvox.fa"
                            }]
                    },
                    "blast_type": "blastp",
                    "evalue_cutoff": "0.001",
                    "output|out_format": "ext",
                    "adv_opts|adv_opts_selector": "basic"
            }
    };
    /*
    params = // magablast
    {
      "tool_id":"toolshed.g2.bx.psu.edu/repos/devteam/megablast_wrapper/megablast_wrapper/1.2.0",
      "tool_version":"1.2.0",
      "inputs":{
        "input_query":{
          "batch":false,
          "values":[
            {
              "hid":26,
              "id":"63cd3858d057a6d1",
              "name":"http://localhost/jb-galaxy-blaster/tmp/1460465026990.fasta",
              "src":"hda"
            }
          ]
        },
        "source_select":"13apr2014-htgs",
        "word_size":"28",
        "iden_cutoff":"90",
        "evalue_cutoff":"0.001",
        "filter_query":"yes"
      }
    };
    */
    var jsonstr = JSON.stringify(params);

    request.post({
        url: galaxyUrl+"/api/tools"+"?key="+apiKey, 
        method: 'POST',
        //qs: params,
        headers: {
            //'Content-Type': 'application/json',
            //'Accept':'application/json, text/javascript, */*; q=0.01',
            'Accept-Encoding' : 'gzip, deflate',
            'Accept-Language' : 'en-US,en;q=0.5',
            'Content-Length' : jsonstr.length
            //'Referrer':galaxyUrl,
            //'X-Requested-With':'XMLHttpRequest'
        },
        json: params
    }, function(error, response, body){
        if(error) {
            console.log(error);
        } else {
            console.log(response.statusCode, body);
        }
    });    
    
}
function showTools() {
    console.log("showTools()");
    request(galaxyUrl +"/api/tools"+"?key="+apiKey, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            //console.log(body);
            try {
                    var tools = JSON.parse(body);
                    console.log(body);
            }
            catch (ex) {
                    console.error(ex);
            }
            //console.log(prettyjson.render(tools,pOptions)); // Print the body of response.
            /*
            for(x in tools) {
                    //console.dir(histories[x]);
                    history = histories[x];

                    url = galaxyUrl+history.url+"?"+apiKey;
                    console.log(url);
                    request(url, function(error,response,body) {
                            //console.log(body);
                            try {
                                    var history = JSON.parse(body);
                            }
                            catch (ex) {
                                    console.error(ex);
                            }
                            console.log(prettyjson.render(history,pOptions)); // Print the body of response.
                    });

            }
            */
        }
    });
}

function showHistories(index) {
    console.log('showHistories()',index);
    var hasIndex = (typeof index !== 'undefined') ? true : false;
    
    request(galaxyUrl +"/api/histories"+"?key="+apiKey, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var histories = JSON.parse(body);
            if (!hasIndex) {
                console.log(JSON.stringify(histories,null,2)); // Print the body of response.
                
                for(var i in histories) {
                    console.log(i+" - "+histories[i].id);
                }
                
            }
            else {
                
                h = histories[index].id;
                var url = galaxyUrl +"/api/histories/"+h+"?key="+apiKey;
//                console.log(url);
                request(url, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        var result = JSON.parse(body);
                        list = result.state_ids.ok;
                        //console.log(JSON.stringify(list,null,2)); // Print the body of response.
                        
                        // put the results into a list
                        
                        
                        console.log("list length", list.length);
                        for (var i in list) {
                            //console.log(i,list[i]);

                            d = list[i];
                            //console.log(d);
                            var url = galaxyUrl +"/api/datasets/"+d+"?key="+apiKey;
                            //var url = galaxyUrl +"/api/histories/"+d+"?key="+apiKey;
                            //console.log(url);
                            request(url, function (error, response, body) {
                                if (!error && response.statusCode === 200) {
                                    var result = JSON.parse(body);
                                    
                                    //console.log("result",result.deleted);
                                    if (result.deleted != "true") {
                                        //console.log(h+' '+result.name);
                                        console.log(result.deleted);
                                        console.log("----------------------");
                                    }
                                }
                            });
                        }
                    }
                });
            
            }
        }
    });
}

function currentHistoryJSON(postFn) {
    console.log("currentHistoryJSON()");
    
    var myPostFn = postFn;
    
    request(galaxyUrl +"/history/current_history_json", function (error, response, body) {
      if (!error && response.statusCode == 200) {
            //console.log(body);
            try {
                    myPostFn();
            }
            catch (ex) {
                    console.error(ex);
            }
      }
    });
}

// export files found in current history into the exportpath
function exportFiles(exportpath) {
    
    var theExportPath = exportpath;
    
    console.log('exportFiles()');
    request(galaxyUrl +"/api/histories"+"?key="+apiKey, function (error, response, body) {
      if (!error && response.statusCode == 200) {
            //console.log(body);
            try {
                    var histories = JSON.parse(body);
                    console.log(prettyjson.render(histories,pOptions)); // Print the body of response.
            }
            catch (ex) {
                    console.error(ex);
            }


            for(var x in histories) {
                console.log('showing histories['+x+']');
                history = histories[x];

                // get the summerized history entry
                var url = galaxyUrl+history.url+"/contents"+"?key="+apiKey;
                console.log(url);
                request(url, function(error,response,body) {
                    //console.log(body);
                    try {
                        var historyList = JSON.parse(body);
                        
                        //console.log(prettyjson.render(historyList,pOptions)); // Print the body of response.
                        
                        // choose fasta files 
                        for(var i=0;i<historyList.length;i++) {
                            if (historyList[i].deleted===false && historyList[i].extension==="fasta") {
                                
                                console.log("\n---------------------------------------------name="+historyList[i].name);
                                //console.log(prettyjson.render(historyList[i],pOptions)); // Print the body of response.
                            
                                // get the dataset entry (containing the filename etc
                                var url = galaxyUrl+historyList[i].url+"?key="+apiKey;
                                
                                request(url, function(error,response,body) {
                                    //console.log(body);
                                    try {
                                        var dataEntry = JSON.parse(body);
                                        //console.log(prettyjson.render(dataEntry,pOptions)); // Print the body of response.
                                        console.log("\n---------------------------------------------name="+dataEntry.name);
                                        
                                        //copy the file to exportpath
                                        fs.createReadStream(dataEntry.file_name).pipe(fs.createWriteStream(theExportPath+"/"+dataEntry.name));
                                        
                                    }
                                    catch (ex) {
                                        console.error(ex);
                                    }
                                });
                            }
                        }

                        
                        //var histlist = history.state_ids.ok;
                        //console.log(prettyjson.render(histlist,pOptions));
                    }
                    catch (ex) {
                        console.error(ex);
                    }
                });

                break;  // only handle one iteration
            }
      }
    });
    
}

function showJobs() {
    console.log('showHistories()');
    request(galaxyUrl +"/api/jobs"+"?key="+apiKey, function (error, response, body) {
      if (!error && response.statusCode == 200) {
            //console.log(body);
            try {
                    var jobs = JSON.parse(body);
            }
            catch (ex) {
                    console.error(ex);
            }
            console.log(prettyjson.render(jobs,pOptions)); // Print the body of response.
/*
            console.log("Showing individual histories...");

            for(x in jobs) {
                    console.log('histories['+x+']');
                    job = jobs[x];

                    url = galaxyUrl+history.url+"?key="+apiKey;
                    console.log(url);
                    request(url, function(error,response,body) {
                            //console.log(body);
                            try {
                                    var history = JSON.parse(body);
                            }
                            catch (ex) {
                                    console.error(ex);
                            }
                            console.log(prettyjson.render(history,pOptions)); // Print the body of response.
                    });

            }
*/
      }
    });
}
