/* 
 */


module.exports = {

    fmap: {
        workflow_submit:    'post',
        get_workflows:      'get',
        set_filter:         'post',
        get_blastdata:      'get',
        get_trackdata:      'get',
        get_hit_details:    'get',
    },
    init: function(params,cb) {
        
    },
    workflow_submit: function(req, res) {
        sails.log("galaxy workflow_submit");
        res.ok({a:1,b:2});
    },
    get_workflows: function(req, res) {
        sails.log("galaxy get_workflows");
        res.ok({a:3,b:4});
    },
    set_filter: function(req, res) {
        res.ok();
    },
    get_blastdata: function(req, res) {
        res.ok();
    },
    get_trackdata: function(req, res) {
        res.ok();
    },
    get_hit_details: function(req, res) {
        res.ok();
    }
};
