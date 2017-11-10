/* 
 */
var fs = require('fs-extra');

module.exports = {

    fmap: {
        set_filter:         'post',
        get_blastdata:      'get',
        get_trackdata:      'get'
    },
    init: function(params,cb) {
        return cb();
    },
    /**
     * 
     * REST Request:
     *      POST /service/exec/set_filter
     *      
     * @param {object} req
     *    req.body = {
     *      filterParams: {score:{val: 50}, evalue:{val:-2}...
     *      dataSet: (i.e. "sample_data/json/volvox" generally from config.dataRoot)
     *      asset: asset id
     *    } 
     * @param {type} res
     * @returns {undefined}
     */
    set_filter: function(req, res) {
        rest_applyFilter(req,res);
    },
    /**
     * REST Request:
     *      GET /service/exec/set_filter
     * 
     * @param {object} req
     * @param {object} res
     * @returns {}
     * 
     */
    get_blastdata: function(req, res) {
        rest_applyFilter(req,res);
    },
    /**
     * REST Request:
     *      GET /service/exec/set_filter
     * 
     * @param {type} req
     * @param {type} res
     * @returns {undefined}
     */
    get_trackdata: function(req, res) {
        var params = req.allParams();

        var asset = params.asset;
        var dataset = params.dataset;

        var g = sails.config.globals.jbrowse;

        //var gfffile = g.jbrowsePath + dataset +'/'+ g.jblast.blastResultPath + '/' + 'sampleResult.gff3';
        var gfffile = g.jbrowsePath + dataset + '/'+ g.jblast.blastResultPath + '/' + asset +'.gff3';

        try {
            var content = fs.readFileSync(gfffile);
        }
        catch (err) {
            var str = JSON.stringify(err);
            //var str = str.split("\n");
            sails.log.error("failed to retrieve gff3 file",str);
            return sails.hooks['jbcore'].resSend(res,{status: 'error', msg: str, err:err});
        };

        return res.send(content);
    }
};
/*
 * Process REST /jbapi/gethitdetails
 */

function rest_getHitDetails(req,res,cb) {
    
    var params = req.allParams();
    
    var asset = params.asset;
    var hitkey = params.hitkey;
    var dataset = params.dataset;
    
    filter.getHitDetails(hitkey, dataset, asset, function(hitData) {
       cb(hitData); 
    });
};

/*
 * 
 */
function rest_applyFilter(req,res) {
    var g = sails.config.globals;
    var requestData = req.allParams();

    var err = filter.writeFilterSettings(requestData,function(filterData) {
        filter.applyFilter(filterData,requestData,function(data) {
    
            return res.send(data);
        });
    });
    if (err) {
        return res.send({status:'error',err:err});
    }
};
