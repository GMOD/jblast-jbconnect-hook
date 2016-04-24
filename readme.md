# JBrowse Galaxy Blaster Plugin

##Requires:

node.js 4 or better, 
sails.js, 
other npm dependencies (see source code).
Will make this more automatic, later.

##Start Galaxy in one shell
/var/www/html/galaxy
sh run.sh (port 8080)

##Relies on redis server; start redis service first.
service redis start (CentOS)

##In jb-galaxy-blaster/jbserve/server, launch server
Requires existing JBrowse installation running on port 80.
(project files will will override JBrowse files, copied manually)

sails lift (port 1337)

##View Jobs in Kue
http://192.168.56.102:1337/kue

##Useful
npm redis-commander

