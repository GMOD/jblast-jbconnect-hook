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
    workflow_submit: function(req, res) {
        galaxyProc.workflowSubmit(req,res);
    },
    /**
     * return a list of workflows
     * 
     * REST Request:
     *      GET /service/exec/get_workflows
     * 
     * @param {object} req - request object
     * @param {object} res - response object
     * 
     * @return (array) return format
        [
          {
            "name": "JBlast Sim No Hits",
            "tags": [],
            "deleted": false,
            "latest_workflow_uuid": "a91ebd20-1d88-4364-80be-cdc9816e8ef7",
            "url": "/api/workflows/2a56795cad3c7db3",
            "published": false,
            "owner": "enuggetry",
            "model_class": "StoredWorkflow",
            "id": "2a56795cad3c7db3"
          },
          {
            "name": "JBlast Example",
            "tags": [],
            "deleted": false,
            "latest_workflow_uuid": "a267f0cf-27cd-4f0d-a80a-19ef72f95dec",
            "url": "/api/workflows/3f5830403180d620",
            "published": false,
            "owner": "enuggetry",
            "model_class": "StoredWorkflow",
            "id": "3f5830403180d620"
          }
        ]
     */
    get_workflows: function(req, res) {
        galaxyProc.getWorkflows(req,res);
    },
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
    get_hit_details: function(req, res) {
        galaxyProc.getHitDetails(req,res);
    }
};
