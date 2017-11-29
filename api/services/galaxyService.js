/* 
 */


module.exports = {

    fmap: {
        workflow_submit:    'post',
        get_workflows:      'get',
        get_hit_details:    'get'
    },
    init: function(params,cb) {
        sails.log(">>> galaxyService.init",typeof cb);
        galaxyProc.init(cb);
    },
    workflow_submit: function(req,res) {   
        return galaxyProc.workflowSubmit(req,res);
    },
    beginProcessing:  function(kJob) {    
        return galaxyUtils.beginProcessing(kJob);
    },
    get_workflows:  function(req,res) {     
        return galaxyProc.getWorkflows(req,res);
    },
    get_hit_details:  function(req,res) {   
        return galaxyProc.getHitDetails(req,res);
    }
};
