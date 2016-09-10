# jblast-galaxy-tools
This is the set of tools and sample workflow specific to jblast.
The scripts in /bin are used by jblast workflow.

Install globally:
```
npm install -g .
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
 