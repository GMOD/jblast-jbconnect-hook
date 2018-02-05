/**
 * @module
 * @description
 * This job service enables accession value lookup utilizeing Entrez API.
 * 
 * Ref: https://www.ncbi.nlm.nih.gov/books/NBK25499/
 * 
 */
var requestp = require('request-promise');

module.exports = {
    fmap: {
        lookup_accession:   'get',
    },
    /**
     * Initialize the module
     * 
     * @param {object} req
     * @param {object} res
     * @param {function} cb - callback function
     */
    init: function(params,cb) {
        return cb();
    },
    /**
     * This does an esummary lookup (using Entrez api), adding the link field into the result.
     * @param {object} req
     * @param {object} res
     */
    lookup_accession: function(req,res) {
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

        sails.log.debug("options",options,accession,typeof accession);

        requestp(options)
            .then(function (data) {
                if (typeof data.result.uids[0] !== 'undefined') {
                    var idx = data.result.uids[0];
                    var link = linkout.replace("[[linkout]]",data.result.uids[0]);
                    data.result[idx].link = link;
                }
                return res.ok(data);
            })
            .catch(function (err) {
                res.serverError(err);
            });    
    }
  
};
