/* 
 */


module.exports = {

    fmap: {
        workflow_submit:    'post',
        get_workflows:      'get',
        //set_filter:         'post',
        //get_blastdata:      'get',
        //get_trackdata:      'get',
        get_hit_details:    'get'
    },
    init: function(params,cb) {
        sails.log(">>> galaxyService.init",typeof cb);
        galaxyProc.init(cb);
    },
    /**
     * submit a sequence and workflow for processing.
     *
     * REST request: 
     *      POST /service/exec/workflow_submit
     * 
     * @param {object} req - request object
     *      req.body = {
     *          region:           (string) region in fasta format,
     *          workflow:         (string) workflow,
     *          dataSet:          (string) dataset path,
     *      };
     * @param {object} res - response object
     */
    workflow_submit:    galaxyProc.workflowSubmit,
    beginProcessing:    galaxyUtils.beginProcessing,
    get_workflows:      galaxyProc.getWorkflows,
    
    /**
     * REST Request:
     *      GET /service/exec/get_hit_details
     *          ?asset=<asset id>
     *          ?dataset=<dataset string>
     *          ?hitkey=<hit key>
     * 
     * @param {type} req - request object
     * @param {type} res - response object
     * @returns {undefined}
     */
    get_hit_details:    galaxyProc.getHitDetails
};
