/**
 * @module
 * @description
 * This module enables accession value lookup utilizeing Entrez API.
 * 
 * Ref: https://www.ncbi.nlm.nih.gov/books/NBK25499/
 * 
 */
var requestp = require('request-promise');

module.exports = {
    /**
     * Initialize the module
     * 
     * @param {object} req
     * @param {object} res
     * @param {function} cb - callback function
     */
    init: function(req,res,cb) {
        sails.log.info("Accession module:",__filename);
        cb();
    },
    /**
     * This does an esummary lookup (using Entrez api), adding the link field into the result.
     * @param {object} req
     * @param {object} res
     * @param {function} cb - callback function
     */

    lookup: function(req,res, cb) {
        var accession = req.param('accession');

        var req = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=nucleotide&id=[[accession]]&retmode=json";
        var linkout = "https://www.ncbi.nlm.nih.gov/nucleotide/[[linkout]]?report=genbank";

        req = req.replace("[[accession]]",accession);

        var options = {
            uri: req,
            headers: {
                'User-Agent': 'Request-Promise'
            },
            json: true
        };

        //sails.log.debug("options",options,accession,typeof accession);

        requestp(options)
            .then(function (data) {
                for (var i in data.result) {
                    var link = linkout.replace("[[linkout]]",data.result[i].uid);
                    data.result[i].link = link;
                }
                cb(data);
            })
            .catch(function (err) {
                cb(err);
            });    
    }
  
};
