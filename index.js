/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
//var request = require('request');
var requestp = require('request-promise');
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');

//var prettyjson = require('prettyjson');   // for debugging

var historyName = '';
var historyId = '';

module.exports = function (sails) {

   return {
        initialize: function(cb) {
            sails.log.info("Sails Hook: "+path.basename(__filename)+" initialize"); 
            // todo: check that galaxy is running

            sails.on('hook:orm:loaded', function() {
                // do something after hooks are loaded
                //console.log(sails.hooks);
                return cb();
            });
            // initialize history
            init_history(this);
            //return cb();
        },
        routes: {
           after: {
              //'post /jbapi/blastregion': rest_BlastRegion,
              'post /jbapi/workflowsubmit': function (req, res, next) {
                  sails.log.info(path.basename(__filename),"/jbapi/workflowsubmit");
                  rest_WorkflowSubmit(req,res);
              },

              'post /jbapi/posttest': function (req, res, next) {
                  sails.log.info(path.basename(__filename),"/jbapi/posttest");
                  res.header("Access-Control-Allow-Origin", "*");
                  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                  res.send(req.body);
              },
              'get /jbapi/test': function (req, res, next) {
                  sails.log.info(path.basename(__filename),"/jbapi/gettest");
                  res.send({result:"jb-galaxy-blast gettest success"});
                  //return next();
              }
              
           }
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
            var g = sails.config.globals.jbrowse;
            var gurl = g.galaxy.galaxyUrl;
            var apikey = g.galaxy.galaxyAPIKey;

            var options = {
                uri: gurl+api+"?key="+apikey,
                headers: { 'User-Agent': 'Request-Promise' },
                json: true  // parse json response
            };

            requestp(options)
                .then(function (data) {
                    cb(data);
                })
                .catch(function (err) {
                    console.log('erro GET /api/histories');
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

            var g = sails.config.globals.jbrowse;
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
                json: params
            };

            //console.log(req);
            requestp(req)
                .then(function(data){
                    cb(data);
                })
                .catch(function(err){
                    cberr(err);
                });

        },
        getHistoryId: function() {
            return historyId;
        },
        getHistoryName: function() {
            return historyName;
        },
        /**
         * send file POST (promise)
         * @param {type} theFile
         * @param {type} hId
         * @param {type} cb
         * @returns {undefined}
         */
        sendFileAsync: function(theFile,hId) {
            return new Promise(function (resolve, reject) {
                sendFile(theFile,hId,resolve,reject);
            }); 
        }
    };
};
/**
 * acquire history id from galaxy
 * @returns {undefined}
 */
function init_history(th) {
    sails.log("init_history");
    var g = sails.config.globals.jbrowse;
    historyName = g.galaxy.historyName;
    
    th.galaxyGetAsync('/api/histories')
        .then(function(histlist) {
            for(var i in histlist) {
                if (histlist[i].name===historyName) {
                    historyId = histlist[i].id;
                    sails.log.info('Galaxy History: "'+historyName+'"',historyId);
                    return;
                }
            }
        })
        .catch(function(err) {
            console.log('init_history failed');
        });
}

/**
 * submit workflow
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */
function rest_WorkflowSubmit(req,res) {
    var g = sails.config.globals;
    var region = req.body.region;
    var workflow = req.body.workflow;
    
    // get starting coord of region
    var startCoord = getRegionStart(region);

    var d = new Date();

    // write the BLAST region file
    
    var theBlastFile = "blast_region"+d.getTime()+".fa";
    
    // write the received region into a file
    // todo: handle errors
    
    var blastPath = g.jbrowse.jbrowsePath + g.jbrowse.dataSet[0].dataPath + g.jbrowse.jblast.blastResultPath;
    var theFullBlastFilePath = blastPath+'/'+theBlastFile; 
    console.log("theBlastFile",theBlastFile);
            
    // if direcgtory doesn't exist, create it
    if (!fs.existsSync(blastPath)){
        fs.mkdirSync(blastPath);
    }  
    
    try {
        ws = fs.createWriteStream(theFullBlastFilePath);
        ws.write(region);
        ws.end();
    }
    catch (e) {
        console.log(e,theFullBlastFilePath);
        return;
    }
    
    // write variable to global
    // todo: later the name and perhaps additional info should come from the FASTA header (ie: JBlast ctgA ctgA:46990..48410 (- strand)
    // which should appear as the track name when the operation is done.
    var blastData = {
            "name": "JBlast", 
            //"blastSeq": "/var/www/html/jb-galaxy-blaster/tmp/44705works.fasta",
            "blastSeq": theFullBlastFilePath,
//            "originalSeq": "/var/www/html/jb-galaxy-blaster/tmp/volvox.fa",
            "offset": startCoord
    };
    
    sails.hooks['jbcore'].setGlobalSection(blastData,"jblast", function(err) {
        
        if (err) {
            console.log("jbcore: failed to save globals");
            return;
        }

        var jg = g.jbrowse;
        var theFile = jg.jbrowseURL + jg.dataSet[0].dataPath + jg.jblast.blastResultPath+'/'+theBlastFile;
        
        // create the kue job entry
        var kJob = g.kue_queue.create('galaxy-workflow-watch', {
            blastData: blastData,
            dataset: {
                workflow: workflow,
                file: theFile
            }
        })
        .state('active')
        .save(function(err){
            if (!err) {
                console.log("workflow watch adding job id = "+kJob.id);
                return;
            }
            console.log('error creating workflow watch job');
        });
        
        // promise chain
        // send the file
        var p = sails.hooks['jb-galaxy-blast'].sendFileAsync(theFile,historyId)
            .then(function(data) {
                //console.log("send file result",data);

                kJob.data.dataset = data;
                kJob.save();

                var fileId = data.outputs[0].id;

                var params = {
                    workflow_id: workflow,
                    history: 'hist_id='+historyId,
                    ds_map: {
                        "0": {
                            src: 'hda',
                            id: fileId
                        }
                    }
                };
                // submit the workflow
                return sails.hooks['jb-galaxy-blast'].galaxyPostAsync('/api/workflows',params);
            })
            .then(function(data) {
                kJob.data.workflow = data;
                kJob.save();
                
                // start monioring
                monitorWorkflow(kJob);
            })
            .catch(function(err){
                sails.log.error(err);
                kJob.data.error = err;
                kJob.save();
            });
    });    
}
/**
 * Monitor workflow
 * @param {type} kWorkflowJob
 * @returns {undefined}
 */
function monitorWorkflow(kWorkflowJob){
    sails.log.debug('monitorWorkflow starting');
    
    var loop = setInterval(function(){
        var hId = sails.hooks['jb-galaxy-blast'].getHistoryId();
        var outputs = kWorkflowJob.data.workflow.outputs;    // list of workflow output history ids
        var outputCount = outputs.length;
        
        // get history entries
        var p = sails.hooks['jb-galaxy-blast'].galaxyGetAsync('/api/histories/'+hId+'/contents')
            .then(function(hist) {
                // reorg to assoc array
                var hista = {};
                for(var i in hist) hista[hist[i].id] = hist[i];

                // determine aggregate state
                var okCount = 0;
                for(var i in outputs) {
                    // if any are running or uploading, we are active
                    if(hista[outputs[i]].state==='running' || hista[outputs[i]].state==='upload')
                        break;
                    // if something any history error, the whole workflow is in error
                    if(hista[outputs[i]].state==='error') {
                        kWorkflowJob.state('failed');
                        kWorkflowJob.save();
                        sails.log.debug('workflow completed in error');
                        clearInterval(loop);
                        break;
                    }
                    if(hista[outputs[i]].state==='ok')
                        okCount++;
                }
                sails.log.debug('workflow step',okCount,'of',outputCount);
                // complete if all states ok
                if (outputCount === okCount) {
                    kWorkflowJob.state('complete');
                    kWorkflowJob.save();
                    clearInterval(loop);
                    sails.log.debug('workflow completed');
                    doCompleteAction();
                }
            })
            .catch(function(err){
                sails.log.error("monitorWorkflow: failed to get history",hId);
            });
        
    },3000);
}
/**
 * Read output of last generated file, copy results to /jblastdata, insert track to trackList.json.
 * @returns {undefined}
 */
function doCompleteAction() {
   
}

function sendFile(theFile,hId,cb,cberr) {
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
            "files_0|url_paste":theFile
        }
    };
    sails.hooks['jb-galaxy-blast'].galaxyPostAsync('/api/tools',params)
       .then(function(data) {
            cb(data);
       })
       .catch(function(err) {
           cb(err);
       });
}

/**
 * fetch file(s) from url (import file into galaxy)
 * @param {type} theFile
 * @param {type} postFn
 * @returns {undefined}
 */
function importFiles(theFile,postFn) {
    console.log('uploadFiles()');
    
    var g = sails.config.globals;
    var myPostFn = postFn;
    
    var params = 
    {
            "tool_id": "upload1",
            "history_id": historyId,   // must reference a history
            "inputs": {
  
                "dbkey":"?",
                "file_type":"auto",
                "files_0|type":"upload_dataset",
                "files_0|space_to_tab":null,
                "files_0|to_posix_lines":"Yes",
                "files_0|url_paste":theFile,
                "files_0|name":"test-test"
            }
    };  
    var jsonstr = JSON.stringify(params);

    request.post({
        url: g.jbrowse.galaxy.galaxyUrl+"/api/tools"+"?key="+g.jbrowse.galaxy.galaxyAPIKey, 
        method: 'POST',
        //qs: params,
        headers: {
            'Accept-Encoding' : 'gzip, deflate',
            'Accept-Language' : 'en-US,en;q=0.5',
            'Content-Length' : jsonstr.length
        },
        json: params
    }, function(error, response, body){
        if(error) {
            console.log(error);
        } else {
            //console.log(response.statusCode, body);
            //JSON.stringify(eval("(" + str + ")"));
            //var result = JSON.parse(body);
            var result = body;
            console.dir(result);
            console.log("imported:");
            console.log(result.outputs[0].hid);
            console.log(result.outputs[0].id);
            console.log(result.outputs[0].name);
            myPostFn(result);
        }
    });    
    
}
// return the starting coordinate
//  >ctgA ctgA:3014..6130 (+ strand) class=remark length=3117
function getRegionStart(str) {
    var line = str.split("\n")[0];
    var re = line.split(":")[1].split("..")[0];
    return re;
}

/**
 * REST function for /jbapi/blastregion
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */ 
/* obsolete
function rest_BlastRegion(req,res) {

    var g = sails.config.globals;
    var region = req.body.region;
    
    //console.dir(req.body);
    
    console.log("/jbapi/blastregion");
    console.log(region);

    
    //todo: verify the operation can be run
    // for example, if it is already running, don't run again.
    
    
    var d = new Date();
    
    var theFile = "jbrowse_"+d.getTime()+".fa";
    
    // write the received region into a file
    // todo: handle errors
    ws = fs.createWriteStream(g.jbrowse.filePath+theFile);
    ws.write(region);
    ws.end();
    
    // import into galaxy
    importFiles(g.jbrowse.urlPath+theFile,function(data) {
        console.log("completed import");
        
        var args = {
            hid: data.outputs[0].hid,
            id: data.outputs[0].id,
            name: "blast "+path.basename(data.outputs[0].name)
        };
        
        execTool_megablast(args,function(data) {
            console.log("completed blast submit");
            
            var args = {
                hid: data.outputs[0].hid,
                id: data.outputs[0].id,
                name: data.outputs[0].name
            };
            
            execTool_blastxml2tab(args,function(data) {
               console.log("completed blastxml2tabular submit "); 
            });
        });

    });
    
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.send({result:"success"});
}
*/

// run blast
/* obsolete
function execTool_megablast(args,postFn){
    console.log('execTool_blastPlus()');
    console.dir(args);
    var myPostFn = postFn;
    var g = sails.config.globals;
    
    // megablast
   // NCBI Blast
    var params = 
    {
      "tool_id":"toolshed.g2.bx.psu.edu/repos/devteam/ncbi_blast_plus/ncbi_blastn_wrapper/0.1.07",
      "tool_version":"0.1.07",
      "history_id": historyId,   // must reference a history, todo: make this a variable
      "inputs":{
        "query":{
          "batch":false,
          "values":[
            {
              "hid": args.hid, 
              "id": args.id, 
              "name": args.name,
              "src":"hda"
            }
          ]
        },
        "db_opts|db_opts_selector":"db",
        "db_opts|database":"17apr2014-nt",
        "db_opts|histdb":"",
        "db_opts|subject":"",
        "blast_type":"blastn",
        "evalue_cutoff":"0.001",
        "output|out_format":"5",
        "adv_opts|adv_opts_selector":"basic"
      }
    };    
    
    var jsonstr = JSON.stringify(params);

    request.post({
        url: g.jbrowse.galaxy.galaxyUrl+"/api/tools"+"?key="+g.jbrowse.galaxy.galaxyAPIKey, 
        method: 'POST',
        //qs: params,
        headers: {
            //'Content-Type': 'application/json',
            //'Accept':'application/json, text/javascript, ; q=0.01',
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
            var result = body;
            //console.log(response.statusCode, body);
            myPostFn(result);
        }
    });    
    
}
*/
// run Blast XML to Tabular
/* obsolete
function execTool_blastxml2tab(args,postFn){
    console.log('execTool_blastPlus()');
    console.dir(args);
    var myPostFn = postFn;
    var g = sails.config.globals;
    
    var params = 
    {
      "tool_id":"toolshed.g2.bx.psu.edu/repos/devteam/ncbi_blast_plus/blastxml_to_tabular/0.1.07",
      "tool_version":"0.1.07",
      "history_id": historyId,   // must reference a history, todo: make this a variable
      "inputs":{
        "blastxml_file":{
          "batch":false,
          "values":[
            {
              "hid": args.hid, 
              "id": args.id, 
              "name": args.name,
              "src":"hda"
            }
          ]
        },
        "output|out_format":"ext"
      }
    };
            
    
    var jsonstr = JSON.stringify(params);

    request.post({
        url: g.jbrowse.galaxy.galaxyUrl+"/api/tools"+"?key="+g.jbrowse.galaxy.galaxyAPIKey, 
        method: 'POST',
        //qs: params,
        headers: {
            //'Content-Type': 'application/json',
            //'Accept':'application/json, text/javascript, ; q=0.01',
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
            var result = body;
            //console.log(response.statusCode, body);
            myPostFn(result);
        }
    });    
    
}
*/