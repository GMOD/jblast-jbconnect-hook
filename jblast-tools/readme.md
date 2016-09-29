# jblast-galaxy-tools
This is the set of tools and sample workflow specific to jblast.
The scripts in /bin are used by jblast workflow.

Instructions for getting the Galaxy API key.
https://wiki.galaxyproject.org/Learn/API

Install globally:
```
npm install -g .
```
Note: must have proper permission to the global node_modules (/usr/local/lib/node_modules) directoryand the /bin directory.

Initial launch of galaxy docker:

docker run -i -t -p 8080:80 -v /var/www/html/galaxy_jblast/:/export/ bgruening/galaxy-blast
The first time this is run, it takes a few minutes to get started.  This is because it's the galaxy data and databases into the ../galaxy_jblast image

docker run -i -t -p 8080:80 -v /var/www/html/galaxy_jblast/:/export/ -e GALAXY_CONFIG_TOOL_CONFIG_FILE=config/tool_conf.xml.sample,config/shed_tool_conf.xml.jblast,config/jblast_tool_conf.xml bgruening/galaxy-blast
(replace -i -t with -d to run in daemon mode).

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


