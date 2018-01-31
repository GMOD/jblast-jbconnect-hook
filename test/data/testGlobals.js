/*
 * jblast tools configuration
 */
var jbPath = process.cwd() + "/node_modules/jbrowse/";

module.exports.globals = {
    jbrowse: {
        jbrowseRest: "http://localhost:1337",
        jbrowsePath: jbPath,                        // or "/var/www/jbrowse/"
        routePrefix: "jbrowse",                     // jbrowse is accessed with http://<addr>/jbrowse

        galaxy: {
            galaxyUrl: "http://localhost:8080",

            galaxyPath: "/var/www/html/galaxy",
            galaxyAPIKey: "c7be32db9329841598b1a5705655f633",

            // jblast will use this Galaxy history when galaxyService is installed
            historyName: "Unnamed history",
            setupDemos: true
        },
        jblast: {
            blastResultPath: "jblastdata",
            blastResultCategory: "JBlast Results",
            trackTemplate: "jblastTrackTemplate.json",
            import: ["blastxml"],
            defaultBlastProfile: 'htgs',
            blastProfiles: {
                // blast profiles are parameter lists that translate to blastn cli parameters sets
                // (i.e. for "remote_htgs" would translate to "blastn -db htgs -remote")
                // These will override any default parameters defined in blastjs
                'htgs': {
                    'db': 'htgs'
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
        libRoutes: {
                'SliderPips':    {module:'jQuery-ui-Slider-Pips', vroute:'/jblib/slider-pips'}
        },
        webIncludes: {
            "jblast-css-SliderPips":    {lib: "/jblib/slider-pips/dist/jquery-ui-slider-pips.min.css" },
            "jblast-js-SliderPips":     {lib: "/jblib/slider-pips/dist/jquery-ui-slider-pips.min.js" }
        }
        
    }
};
