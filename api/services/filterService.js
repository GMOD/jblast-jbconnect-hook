/**
 * @module
 * @description
 * This jservice provides restful APIs for processing filter requests.
 * 
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
     * Based on new filter settings provided by the caller, updates the associated
     * filtersettings file and the resulting GFF3 file containing filtered
     * features.
     * 
     * REST Request:
     *      POST `/service/exec/set_filter`
     *      
     * @param {object} req - request
     * 
     * ::
     * 
     *    req.body = {
     *      filterParams: {score:{val: 50}, evalue:{val:-2}...
     *      dataSet: (i.e. "sample_data/json/volvox" generally from config.dataRoot)
     *      asset: asset id
     *    }
     *     
     * @param {object} res - response
     */
    set_filter: function(req, res) {
        var g = sails.config.globals;
        var requestData = req.allParams();

        var err = filter.writeFilterSettings(requestData,function(filterData) {
            console.log(">>> filterData",filterData);
            filter.applyFilter(filterData,requestData,function(filterSummary) {

                console.log(">>> data",filterSummary);
                return res.send(filterSummary);
            });
        });
        if (err) {
            return res.send({status:'error',err:err});
        }
    },
    /**
     * Determine filter details, like number of hit results.
     * REST
     *      `GET /service/exec/set_filter`
     *      data: eg. `{asset: '151_1517462263883', dataset: 'sample_data/json/volvox'}`
     * 
     * Return data: eg. `{ result: 'success', hits: 792, filteredHits: 501 }`
     *   
     * @param {object} req - request
     * @param {object} res - response
     * 
     */
    get_blastdata: function(req, res) {
        var g = sails.config.globals;
        var requestData = req.allParams();

        var err = filter.getFilterSettings(requestData,function(filterData) {
            console.log(">>> filterData",filterData);
            filter.getHitDataFiltered(filterData,requestData,function(filterSummary) {

                console.log(">>> data",filterSummary)
                return res.send(filterSummary);
            });
        });
        if (err) {
            return res.send({status:'error',err:err});
        }
    },
    /**
     * Fetch the GFF3 file of the prior filter operation
     * 
     * ``GET /service/exec/set_filter``
     * 
     * @param {type} req - request
     * @param {type} res - response
     * 
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

