# JBlast BLAST/Galaxy JBrowse Server Hook

### Prerequsite

```
git clone https://github.com/GMOD/jbserver.git
cd jbserver
```

Install JBrowse in a separate directory

Install Galaxy in a separate directory

### Installation
```
npm install jbh-jblast
```

### Required Setup Steps

Start and setup galaxy.  
 - Create a user. 
 - Make the user and Admin (by editing galaxy.ini)
 - get the galaxy API key.
 - load tools 

Modify config.js.  Modify it with the information about the location of jbrowse, galaxy.  Update with galaxy API key.

startup galaxy (`sh run.sh`)
```
./jbutils --config     // review the configuration
./jbutil --
```

### Steps for readying the demo (optional)
The demo depends on the JBrowse Volvox example.

Download the NCBI BLAST Database.

```
npm install jblast-simtool -g  // install utility used by JBlast Galaxy tools

./jbutil --blastdbpath=<path of blast database that was downloaded>
./jbutil --setupindex        // copies the index.html example
./jbutil --setupworkflow     // setup example workflows
./jbutil --setuptools        // setup galaxy tools for JBlast simulation
./jbutil --setupdata         // setup sample data
```

### Launch
```
sails lift
```

(more details to come)
