/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var jblastProc = require('../../services/jblastProc');

module.exports = {
    routes: function() {
        return {
            // these routes generally not under policy engine unless specifically defined
            before: {
                'get /hi': {
                    controller: 'WorkflowMgrController',
                    action: 'hello'
                }
                
            },
            // these routes are behind global policies
            after: {
                'post /jbapi/workflowsubmit': jblastProc.workflowSubmit,
                'get /jbapi/getworkflows': jblastProc.getWorkflows,
                'post /jbapi/setfilter': jblastProc.setFilter,
                'get /jbapi/getblastdata/:asset/:dataset': jblastProc.getBlastData,
                'get /jbapi/gettrackdata/:asset/:dataset': jblastProc.getTrackData,
                'get /jbapi/gethitdetails/:asset/:dataset/:hitkey': jblastProc.getHitDetails,
                'get /jbapi/lookupaccession/:accession': jblastProc.lookupAccession
            }
            
        };
    }
};