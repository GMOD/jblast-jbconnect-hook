var request = require('request');
//var requestp = require('request-promise');
//var path = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));
var util = require('./utils');

module.exports = {
    init: function(cb,cberr) {
        var g = sails.config.globals.jbrowse;
        this.historyName = g.galaxy.historyName;
        
        this.initHistory(
            function(data) {
                cb(data);
            },
            function(error) {
                cberr(error);
            });
    },
    /* promise-ized galaxyGetJSON function
     * 
     * @param {type} api
     * @returns {Promise}
     */
    galaxyGetPromise: function(api) {
        var thisB = this;
        return new Promise(function(resolve, reject) {
            thisB.galaxyGET(api, resolve, reject);
        });
    },
    /* promise-ized galaxyPostJSON function
     * 
     * @param {type} api
     * @returns {Promise}
     */
    galaxyPostPromise: function(api,params) {
        var thisB = this;
        return new Promise(function(resolve, reject) {
            thisB.galaxyPOST(api,params, resolve, reject);
        });
    },
    /**
     * send JSON GET request to galaxy server
     * @param {type} api - i.e. '/api/histories'
     * @param {type} cb  callback i.e. function(retval)
     * @returns {undefined}
     * 
     */
    galaxyGET: function(api,cb,cberr) {
        var g = sails.config.globals.jbrowse;
        var gurl = g.galaxy.galaxyUrl;
        var apikey = g.galaxy.galaxyAPIKey;

        //sails.log.debug("GET", options);
        var url = gurl+api+"?key="+apikey
        
        sails.log.debug("galaxyPOST",url);

        
        request(gurl+api+"?key="+apikey, function (error, response, body) {
            sails.log('error',error, 'response',typeof body, response && response.statusCode,url);

            if (error !== null) {
                cberr(error);
                return;
            }
            cb(JSON.parse(body));
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
    galaxyPOST: function(api,params,cb,cberr) {

        var g = sails.config.globals.jbrowse;
        var gurl = g.galaxy.galaxyUrl;
        var apikey = g.galaxy.galaxyAPIKey;

        var pstr = JSON.stringify(params);

        var url = gurl+api+"?key="+apikey; 
        var headers = {
            'Connection': 'keep-alive',
            'Accept-Encoding' : 'gzip, deflate',
            'Accept': '*/*',
            'Accept-Language' : 'en-US,en;q=0.5',
            'Content-Length' : pstr.length
        };

        sails.log.debug("galaxyPOST",url,params,headers);

        //var request = require('request');
        request.post({
            headers: headers,
            url:     url,
            body:    params
        }, function(error, response, body){
              if (error !== null) {
                  cberr(body);
                  return;
              }
              cb(JSON.parse(body));
        });
    },
    getHistoryId: function() {
        return this.historyId;
    },
    getHistoryName: function() {
        return this.historyName;
    },
    /**
     * acquire history id from galaxy
     * @returns {undefined}
     */
    initHistory: function (cb,cberr) {
        sails.log("init_history");
        var thisb = this;
        
        var g = sails.config.globals.jbrowse;
        this.historyName = g.galaxy.historyName;
        
        this.galaxyGET('/api/histories',function(histlist) {
            //sails.log.debug('histlist',histlist);
            for(var i in histlist) {
                //sails.log.debug("historylist[i].name",histlist[i].name,thisb.historyName);
                if (histlist[i].name === thisb.historyName) {
                    thisb.historyId = histlist[i].id;
                    sails.log.info('Galaxy History: "'+thisb.historyName+'"',thisb.historyId);
                    cb({
                        historyName:thisb.historyName,
                        historyId:thisb.historyId
                    });
                    return;
                }
            }
            var errmsg = "id not found for "+thisb.historyName;
            sails.log.error(errmsg);
            cberr({status:'error',msg:errmsg});
        },
        function(err) {
            var errmsg = 'init_history failed - is galaxy running?';
            sails.log.error(errmsg);
            cberr({status:'error',msg:errmsg,err:err});
        });
    },
    getWorkflows: function(cb,cberr) {
        
        this.galaxyGET("/api/workflows",
            function(workflows) {
                cb(workflows)
            },
            function(error) {
                cberr({status:'error',msg:"galaxy GET /api/workflows failed",err:error});
            });
    },
    /**
     * 
     * @param {type} theFile
     * @param {type} hId
     * @param {type} cb
     * @param {type} cberr
     * @returns {undefined}
     */
    sendFile: function(theFile,hId,cb,cberr) {
        sails.log.debug("sendFile",theFile,hId);
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
        sails.log.debug("params",params);
        var strParams = JSON.stringify(params)
        this.galaxyPOST('/api/tools',strParams,
            function(data) {
                cb(data);
            },
            function(error) {
                cberr(error);
            });

    },
    workflowSubmit: function(params,cb,cberr) {
        var thisb = this;
        var g = sails.config.globals;
        var region = params.region;
        var workflow = params.workflow;
        var dataSetPath = params.dataSetPath;
        var monitorFn = params.monitorFn;

        // get starting coord of region
        var startCoord = util.getRegionStart(region);
        var seq = util.parseSeqData(region);

        var d = new Date();

        //sails.log.debug('g.jbrowse',g.jbrowse);

        // write the BLAST region file
        var theBlastFile = "blast_region"+d.getTime()+".fa";
        var blastPath = g.jbrowse.jbrowsePath + dataSetPath +'/'+ g.jbrowse.jblast.blastResultPath;
        var theFullBlastFilePath = blastPath+'/'+theBlastFile; 

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
            sails.log.error(e,theFullBlastFilePath);
            cb({status: 'error', msg: "failed to write",err:e});
            return;
        }

        var blastData = {
                "name": "JBlast", 
                "blastSeq": theFullBlastFilePath,
                "offset": startCoord
        };

        var theFile = g.jbrowse.jbrowseURL + dataSetPath+'/' + g.jbrowse.jblast.blastResultPath+'/'+theBlastFile;

        // create the kue job entry
        var jobdata = {
            name: "Galaxy workflow",
            jbrowseDataPath: dataSetPath,
            sequence: seq,
            blastData: blastData,
            dataset: {
                workflow: workflow,
                file: theFile
            }
        };
        var job = g.kue_queue.create('galaxy-workflow-watch', jobdata)
        .save(function(err){
            if (err) {
                cberr({status:'error',msg: "error create kue galaxy-workflow-watch",err:err});
            }
        });
        // process job
        sails.log.debug("checkpoint 1");
        g.kue_queue.process('galaxy-workflow-watch', function(kJob, kDone){
            kJob.kDoneFn = kDone;
            sails.log.debug("galaxy-workflow-watch job id = "+kJob.id);


            kJob.progress(0,10,{file_upload:0});

            // send the file
            var terminatePromise = false;
            sails.log.info("uploading file to galaxy",theFile)

            // error handler
            var errorFn = function(err) {
                var msg = "Error in WorkflowSubmit";
                sails.log.error(msg,err);
                kDone(new Error(msg));
                cberr({status: 'error',msg:msg,err: err});
            };
            
            thisb.sendFile(theFile,thisb.historyId, function(data) {
                    sails.log.debug("send complete");
                    kJob.data.dataset = data;
                    kJob.save();

                    kJob.progress(1,10,{file_upload:'done'});

                    var fileId = data.outputs[0].id;

                    var params = {
                        workflow_id: workflow,
                        history: 'hist_id='+thisb.historyId,
                        ds_map: {
                            "0": {
                                src: 'hda',
                                id: fileId
                            }
                        }
                    };
                    // submit the workflow
                    galaxyPOST('/api/workflows',params,
                    function(data) {
                        for(var i in data) {
                            var wf = data[i];
                            if (wf.id === workflow) {
                                sails.log.info("Workflow starting: "+wf.name+' - '+wf.id);
                                kJob.data.workflow.name = wf.name;
                                kJob.data.name = "Galaxy workflow: "+wf.name;
                                kJob.save();

                                kJob.progress(2,10,{start_workflow:'done'});

                                // start monitoring
                                monitorFn(kJob);

                                cb({status:'success',jobId: kJob.id});
                                return ;
                            }
                        }
                        // if we get here, somethings wrong
                        var errmsg = 'failed to match workflow id '+workflow;
                        cberr({status:'error',msg: errmsg});
                        sails.log.error(errmsg);
                    },errorFn);
                },errorFn);
        });
    }
};
