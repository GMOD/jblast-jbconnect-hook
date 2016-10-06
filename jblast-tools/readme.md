# jblast-galaxy-tools
This is the set of tools and sample workflow specific to jblast.
The scripts in /bin are used by jblast workflow.

Instructions for getting the Galaxy API key.
https://wiki.galaxyproject.org/Learn/API

###Download the Blast Database:
```
cd /var/www
rsync -avzP rsync://datacache.g2.bx.psu.edu/indexes/blastdb .
```
Take a long coffee break.  You're downloading 300+ gig.
The result will be 4 databased in the /var/www/blastdb directory.

###install and launch galaxy docker
Initial launch of galaxy docker.  Start docker first.
(note, in this demo, do not change the /export directory name. Certain setup scripts expect the export directory)
```
service docker start
docker run -i -t -p 8080:80 -v /var/www/galaxy_jblast/:/export/ bgruening/galaxy-blast
```
The first time this is run, it takes a few minutes to get started, as it pulls in docker dependencies for the first time.
This will install galaxy docker in the /var/www/galaxy_jblast directory

###Install pull the jblast:
(this part needs more work)
```
git clone https://github.com/GMOD/jblast
cd jblast/jblast-tools
```
Edit config.js
```
nano config.js
```
Edit the references
```
module.exports = {
    jbrowsePath: "/var/www/jbrowse/",
    dataSet: [
        {
            dataPath: "sample_data/json/volvox/"
        }
    ],
    galaxy: {
        galaxyUrl: "http://localhost:8080",
        galaxyPath: "/var/www/galaxy_jblast",
        galaxyAPIKey: "3ac9578a0158a218b5f129c912795239",
        
        // jblast will use this Galaxy history
        historyName: "JBlast History"
    },
    jblast: {
        blastResultPath: "jblastdata"
    }
};
```
Then install globally:
```
npm install -g .
```

###setup jblast
Make sure the docker galaxy instance is running.
```
jblast --setupall
```


###launch modified docker galaxy
Ctrl-C out of galaxy and now run this:
```
docker run -i -t -p 8080:80 -v /var/www/galaxy_jblast/:/export/ -e GALAXY_CONFIG_TOOL_CONFIG_FILE=config/tool_conf.xml.sample,config/shed_tool_conf.xml.jblast,config/jblast_tool_conf.xml bgruening/galaxy-blast
(replace -i -t with -d to run in daemon mode).
```

## Troubleshooting

The scripts in the bin directory need unix line terminators b/c the line one 
script interpreter definition for node (!#/usr/bin/env node) seems to require it.
Otherwise, the scripts do not run from the shell.
This can happen when editing scripts with a Windows editor.

To manually fix this, do this for each script before npm install.
This will convert line endings to unix format.
```
tr -d '\15\32' < jblaststart.js > jblaststart.js
```


