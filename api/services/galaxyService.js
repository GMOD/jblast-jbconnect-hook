/* 
 */


module.exports = {

    fmap: {
        //workflow_submit:    'post',
        get_workflows:      'get',
        get_hit_details:    'get'
    },
    init: function(params,cb) {
        sails.log(">>> galaxyService.init");
        //galaxyProc.init(cb);        var cb2 = cb;
        // TODO: check that galaxy is running

        galaxyUtils.init(function(history) {

            historyId = history.historyId;
            cb(null,'success');

        }, function(err) {
            sails.log.error("failed galaxy.init",err);
            cb(err);
        });

        
        
    },
    validateParams: function(params) {
        if (typeof params.workflow === 'undefined') return "workflow not defined";
        if (typeof params.region === 'undefined') return "region not undefined";
        return 0;   // success
    },
    generateName(params) {
        return params.workflow;
    },
    //workflow_submit: function(req,res) {   
    //    return galaxyProc.workflowSubmit(req,res);
    //},
    beginProcessing:  function(kJob) {    
        //return galaxyUtils.beginProcessing(kJob);
        //params.monitorFn = this.monitorWorkflow;
        return galaxyUtils.beginProcessing(kJob);
    },
    get_workflows:  function(req,res) {     
        //return galaxyProc.getWorkflows(req,res);
        galaxyUtils.galaxyGET("/api/workflows",function(workflows,err) {
            if (err !== null) {
                return res.serverError({status:'error',msg:"galaxy GET /api/workflows failed",err:err});
            }
            return res.ok(workflows);
        });
    },
    get_hit_details:  function(req,res) {   
        //return galaxyProc.getHitDetails(req,res);
        
        var params = req.allParams();

        var asset = params.asset;
        var hitkey = params.hitkey;
        var dataset = params.dataset;

        filter.getHitDetails(hitkey, dataset, asset, function(hitData) {
           res.ok(hitData); 
        });
    }
};
