/**
 * @module
 * @desc
 * This provides functional support to galaxyService job service.
 * 
 */
var request = require('request');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));
var util = require('./utils');

module.exports = {
    /**
     * Initialize module
     * @param {type} cb
     * @param {type} cberr
     * @returns {undefined}
     */
    init: function(cb,cberr) {
        var g = sails.config.globals.jbrowse;
        //console.log('globals',g);
        
        this.debugRestFile = g.galaxy.debugRestFile;
        
        this.historyName = g.galaxy.historyName;
        
        // todo: create history if it does not exist
        
        // todo: detect galaxy directory
        
        // todo: detect galaxy API (galaxy is running)
        
        // todo: detect galaxy API KEY is initialized.
        
        // todo: detect blast database installed.
        
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
     * 
     */
    galaxyGET: function(api,cb) {
        var g = sails.config.globals.jbrowse;
        var gurl = g.galaxy.galaxyUrl;
        var apikey = g.galaxy.galaxyAPIKey;

        //sails.log.debug("GET", options);
        var url = gurl+api+"?key="+apikey
        
        sails.log.debug("galaxyGET",url);
         
        if (typeof this.debugRestFile !== 'undefined') {
            var str = '\nGET '+url+'\n';
            fs.appendFileSync(this.debugRestFile,str);
        }
        
        request(url, function (err, response, body) {
            //sails.log('error',err, 'response',typeof body, response && response.statusCode,url);

            if (err !== null) {
                if (typeof this.debugRestFile !== 'undefined') {
                    var str = 'ERROR: '+err+'\n';
                    fs.appendFileSync(this.debugRestFile,str);
                }
                cb(body,err);
                return;
            }
            if (typeof this.debugRestFile !== 'undefined') {
                var str = 'RESPONSE: '+body+'\n';
                fs.appendFileSync(this.debugRestFile,str);
            }
            cb(JSON.parse(body),err);
        });
    },
    /* send JSON POST request to galaxy server
     * 
     * @param {type} api - e.g. "/api/workflows"
     * @param {type} params - json parameter i.e. {a:1,b:2}
     * @param {type} cb - callback function cb(retval)
     */
    galaxyPOST: function(api,params,cb) {

        var g = sails.config.globals.jbrowse;
        var gurl = g.galaxy.galaxyUrl;
        var apikey = g.galaxy.galaxyAPIKey;

        var pstr = JSON.stringify(params);

        var url = gurl+api+"?key="+apikey; 
        var headers = {
              'Content-Type': 'application/json'
//            'Connection': 'keep-alive'
//            'Accept-Encoding' : 'gzip, deflate',
//            'Accept': '*/*',
//            'Accept-Language' : 'en-US,en;q=0.5',
//            'Content-Length' : pstr.length
        };

        sails.log.debug("galaxyPOST",url,params,headers);

        //var request = require('request');
        request({
            //headers: headers,
            url:     url,
            method: 'POST',
            json: true,
            body:    params
        }, function(err, response, body){
              cb(body,err);
        });
    },
    /**
     * 
     * @returns {string} history id
     */
    getHistoryId: function() {
        return this.historyId;
    },
    /**
     * 
     * @returns {string} history name
     */
    getHistoryName: function() {
        return this.historyName;
    },
    /**
     * acquire history id from galaxy
     * 
     * @param {type} cb
     */
    initHistory: function (cb) {
        sails.log("init_history");
        var thisb = this;
        
        var g = sails.config.globals.jbrowse;
        this.historyName = g.galaxy.historyName;
        
        this.galaxyGET('/api/histories',function(histlist,err) {
            //sails.log.debug('histlist',histlist);
            if (err !== null) {
                var errmsg = 'init_history failed - is galaxy running?';
                sails.log.error(errmsg);
                cb(histlist,{status:'error',msg:errmsg,err:err});
                return;
            }
            for(var i in histlist) {
                //sails.log.debug("historylist[i].name",histlist[i].name,thisb.historyName);
                if (histlist[i].name === thisb.historyName) {
                    thisb.historyId = histlist[i].id;
                    sails.log.info('Galaxy History: "'+thisb.historyName+'"',thisb.historyId);
                    cb({
                        historyName:thisb.historyName,
                        historyId:thisb.historyId
                    },null);
                    return;
                }
            }
            var errmsg = "id not found for "+thisb.historyName;
            sails.log.error(errmsg);
            cb(histlist,{status:'error',msg:errmsg});
        });
    },
    /**
     * get workflows
     * @param {type} cb
     * @returns {undefined}
     */
    getWorkflows: function(cb) {
        
        this.galaxyGET("/api/workflows",function(workflows,err) {
            if (err !== null) {
                sails.log.error('GET /api/workflows failed');
            }
            cb(workflows,err);
        });
    },
    /**
     * send file to galaxy
     * 
     * @param {type} theFile
     * @param {type} hId
     * @param {type} cb
     * @param {type} cberr
     * @returns {undefined}
     */
    sendFile: function(theFile,hId,cb) {
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
        //var strParams = JSON.stringify(params)
        this.galaxyPOST('/api/tools',params,function(data,err) {
            if (err !== null) {
                sails.log.error('POST /api/tools failed');
            }
            cb(data,err);
        });

    },
    /**
     * Job service, job entry point.
     * 
     * @param {object} kJob - reference to kue job object
     */
    beginProcessing: function(kJob) {
        sails.log.info("galaxyService beginProcessing"+kJob.data);
       
        var params = kJob.data;
        var thisb = this;
        var g = sails.config.globals;

        var region = params.region;
        var workflow = params.workflow;

        // get starting coord of region
        var startCoord = util.getRegionStart(region);
        var seq = util.parseSeqData(region);

        var d = new Date();

        // write the BLAST region file
        var theBlastFile = kJob.id+"_blast_region"+d.getTime()+".fa";
        var blastPath = g.jbrowse.jbrowsePath + '/' + params.dataset +'/'+ g.jbrowse.jblast.blastResultPath;
        var theFullBlastFilePath = blastPath+'/'+theBlastFile; 

        try {
            // if direcgtory doesn't exist, create it
            fs.ensureDirSync(blastPath);
            
            
            ws = fs.createWriteStream(theFullBlastFilePath);
            ws.write(region);
            ws.end();
        }
        catch (e) {
            sails.log.error(theFullBlastFilePath,e);
            return kJob.kDoneFn(Error('beginProcessing() error '+theFileBlastFilePath,e));
        }

        var blastData = {
                "name": "JBlast", 
                "blastSeq": theFullBlastFilePath,
                "offset": startCoord
        };

        var theFile = 'file://' + g.jbrowse.jbrowsePath + params.dataset+'/' + g.jbrowse.jblast.blastResultPath+'/'+theBlastFile;

        kJob.data.sequence = seq;
        kJob.data.blastData = blastData;
        kJob.data.seqFile = theFile;

        kJob.update(function() {});
 
        this.beginProcessing2(kJob);
    },
    beginProcessing2: function(kJob) {
        
        var thisb = this;
        
        kJob.progress(0,10,{file_upload:0});

        // send the file
        sails.log.info("uploading file to galaxy",kJob.data.seqFile);

        thisb.sendFile(kJob.data.seqFile,thisb.historyId, function(data,err) {
            
            if (err !== null) {
                var msg = "Error sendFile";
                sails.log.error(msg,err);
                return kJob.kDoneFn(new Error(msg));;
            }

            //sails.log.debug("sendFile complete data,err",data,err);
            kJob.data.sendResult = data;
            kJob.update(function() {});

            kJob.progress(1,10,{file_upload:'done'});


            var fileId = data.outputs[0].id;

            var params = {
                workflow_id: kJob.data.workflow,
                history: 'hist_id='+thisb.historyId,
                ds_map: {
                    "0": {
                        src: 'hda',
                        id: fileId
                    }
                }
            };
            // submit the workflow
            thisb.galaxyPOST('/api/workflows',params,function(data,err) {

                if (err !== null) {
                    var msg = "Error run workflow";
                    sails.log.error(msg,err);
                    return kJob.kDoneFn(new Error(msg));
                }

                //sails.log.debug('POST /api/workflows completed',data,err);

                kJob.data.workflowData = data;
                kJob.update(function() {});
                
                thisb.galaxyGET('/api/workflows',function(data,err){
                    //sails.log.debug('GET /api/workflows',data,err);

                    for(var i in data) {
                        var wf = data[i];
                        if (wf.id === kJob.data.workflow) {
                            sails.log.info("Workflow starting: "+wf.name+' - '+wf.id);
                            //kJob.data.name = wf.name;
                            //kJob.data.workflowData = wf;
                            kJob.data.name = "Galaxy workflow: "+wf.name;
                            kJob.update(function() {});

                            kJob.progress(2,10,{start_workflow:'done'});

                            // start monitoring the workflow, kDone is called within.
                            thisb.monitorWorkflow(kJob);
                            return;
                        }
                    }
                    // if we get here, somethings wrong
                    var errmsg = 'failed to match workflow id '+kJob.data.workflow;
                    sails.log.error(errmsg);
                    return kJob.kDoneFn(new Error(msg));
                });
            });
        });
        
    },
    /**
     * Monitor workflow and exit upon completion of the workflow
     * 
     * @param {object} kJob
     */
    monitorWorkflow: function(kJob){
        var thisb = this;
        var wId = kJob.data.workflow;
        sails.log.debug('monitorWorkflow starting, wId',wId);

        var timerloop = setInterval(function(){
            var hId = kJob.data.workflowData.history_id;

            // TODO: if workflow fails, output will not exist.  Need to handle this.
            var outputs = kJob.data.workflowData.outputs;    // list of workflow output history ids
            var outputCount = outputs.length;

            sails.log.info ("history",hId);

            // get history entries
            var url = '/api/histories/'+hId+'/contents';
            thisb.galaxyGET(url,function(hist,err) {

                if (err !== null) {
                    var msg = wId + " monitorWorkflow: failed to get history "+hId;
                    sails.log.error(msg,err);
                    clearInterval(timerloop);
                    kJob.kDoneFn(new Error(msg));
                    return;
                }
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
                        clearInterval(timerloop);
                        //kJob.update(function() {});
                        var msg = wId+' workflow completed in error';
                        sails.log.debug(msg);
                        kJob.kDoneFn(new Error(msg));
                        break;
                    }
                    if(hista[outputs[i]].state==='ok')
                        okCount++;
                }
                sails.log.debug(wId,'workflow step',okCount,'of',outputCount);

                kJob.progress(okCount,outputCount+1,{workflow_id:wId});

                // complete if all states ok
                if (outputCount === okCount) {
                    clearInterval(timerloop);
                    //kJob.state('complete');
                    //kJob.update(function() {});
                    sails.log.debug(wId,'workflow completed');
                    setTimeout(function() {
                        jblastPostAction.doCompleteAction(kJob,hista);            // workflow completed
                    },10);
                }
            });

        },3000);
    }
};
