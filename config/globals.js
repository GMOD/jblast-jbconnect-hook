/*
 * JBlast tools configuration
 * 
 * These configurations are merged with JBConnect ``config/globals.js``
 */
module.exports.globals = {
    jbrowse: {
        // Galaxy settings
        galaxy: {
            // Galaxy API path
            galaxyUrl: "http://localhost:8080",
            
            // Galaxy installation path
            galaxyPath: "/var/www/html/galaxy",
            
            // Galaxy API key (you must obtain this from your Galaxy installation)
            galaxyAPIKey: "c7be32db9329841598b1a5705655f633",

            // The default Galaxy History where workflows will execute
            historyName: "Unnamed history"
        },
        
        // JBlast settings
        jblast: {
            // The subdir where blast results will be deposited (i.e. ``sample_data/json/volvox/jblastdata``)
            blastResultPath: "jblastdata",
            
            // The category for successful blast results in the track selector
            blastResultCategory: "JBlast Results",
            
            // Track template of the blast result track that will be inserted in trackList.json
            trackTemplate: "jblastTrackTemplate.json",
            
            // Type of file that will be imported for processing blast.
            import: ["blastxml"],
            
            /*
             * BLAST profiles
             * blast profiles are parameter lists that translate to blastn cli parameters sets
             * (i.e. for "remote_htgs" would translate to "blastn -db htgs -remote")
             * These will override any default parameters defined in ``blastjs``
             * 
             * Blast profiles generally apply to basicWorkflowService only
             * and do no apply to galaxyService.
             * 
             * Our example uses a subset of htgs, an NCBI curated blast database.
             * So, it is our default profile.
            */
            defaultBlastProfile: 'faux',
            blastProfiles: {
                'htgs': {
                    'db': 'htgs'
                },
                'faux': {
                    'db': 'faux'
                },
                'remote_htgs': {
                    'db': 'htgs',
                    'remote': ""
                }
            }
        },
        // list of services that will get registered.
        services: {
            'basicWorkflowService':     {name: 'basicWorkflowService',  type: 'workflow', alias: "jblast"},
            //'galaxyService':          {name: 'galaxyService',         type: 'workflow', alias: "jblast"},
            'filterService':            {name: 'filterService',         type: 'service'},
            'entrezService':            {name: 'entrezService',         type: 'service'}
        },
        /**/
        webIncludes: {
            "jblast-css-SliderPips":    {lib: "/jblib/jquery-ui-slider-pips.min.css" },
            "jblast-js-SliderPips":     {lib: "/jblib/jquery-ui-slider-pips.min.js" }
        }
    }
};
