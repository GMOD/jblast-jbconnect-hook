/*
 * jblast tools configuration
 */
module.exports = {
    jbrowsePath: "/var/www/html/jbrowse/",
    dataSet: [
        {
            dataPath: "sample_data/json/volvox/"
        }
    ],
    galaxy: {
        galaxyUrl: "http://localhost:8080",
        
        galaxyPath: "/var/www/html/galaxy",
        //galaxyPath: "/var/www/html/galaxy_jblast",    // if docker

        galaxyAPIKey: "c7be32db9329841598b1a5705655f633",
        
        // jblast will use this Galaxy history
        historyName: "JBlast History"
    },
    jblast: {
        blastResultPath: "jblastdata"
    }
};
