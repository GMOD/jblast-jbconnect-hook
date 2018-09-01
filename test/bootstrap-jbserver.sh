#!/bin/bash


npm pack > pack.out

if grep -Fxq "$tgz" pack.out
then
    # code if found
    zipfile=$(grep -F ".tgz" pack.out | tee /dev/tty)
    echo "${zipfile} found"

    jfile="./jbconnect/jbutil"
    if [ -f "$jfile" ]
    then
        echo "$jfile found. JBConnect already exists"
        cd jbconnect
        npm install ../$zipfile 
        
    else
        echo "$jfile not found. Installing JBConnect"
        git clone http://github.com/gmod/jbconnect
        cd jbconnect
        npm install
        npm install ../$zipfile
        exit 0
    fi
else
    # code if not found
    echo "not found"
    exit 1
fi

exit

git clone http://github.com/gmod/jbconnect
cd jbserver
npm install
./jbutil --setupdata
./bin/blast_getBlastUtils.js
./bin/blast_downloadDb.js htgs.05
nohup sails lift --port 5001 > jbconnect.log 2>&1 &
echo $! > save_pid.txt #save last process pid
cd ..
sleep 20

