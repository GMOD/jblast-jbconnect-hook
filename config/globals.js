/*
 * jblast tools configuration
 */
module.exports.globals = {
    jbrowse: {
        galaxy: {
            galaxyUrl: "http://localhost:8080",

            galaxyPath: "/var/www/html/galaxy",
            //galaxyPath: "/var/www/html/galaxy_jblast",    // if docker

            galaxyAPIKey: "c7be32db9329841598b1a5705655f633",

            // jblast will use this Galaxy history
            historyName: "Unnamed history"
        },
        jblast: {
            blastResultPath: "jblastdata",
            blastResultCategory: "JBlast Results",
            insertTrackTemplate: "inMemTemplate.json",
            import: ["blastxml"],
            
        },
        searchSeq: {
            workflowScript: "ServerSearch.workflow.js",
            processScript:   'http://localhost:1337/jbrowse/SearchProcess.html'
        },
        // list of services that will get registered.
        services: [
            {name: 'basicWorkflowService',  type: 'workflow'},
            //{name: 'galaxyService',         type: 'workflow'},
            {name: 'filterService',         type: 'service'},
            {name: 'entrezService',         type: 'service'},
            {name: 'seqSearchService',      type: 'service'}
        ]
    }
};
