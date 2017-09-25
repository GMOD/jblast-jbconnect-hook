***********
Quick Start
***********

The quick start instructions for JBlast demonstrates the use of the stand-alone version
of blast tools and the use of ``blastjs``. 
JBlast is loaded as a an NPM module (since JBServer is generally intended to be a companion of JBrowse.  
JBrowse may also be installed in a separate directory.
(See :ref:`jbs-separate-dir`.)

 
Pre-Install
===========

JBlast requires `redis <https://redis.io/>`_ as a pre-requisite, which is only used by the queue framework 
(`kue <https://www.npmjs.com/package/kue>`_).

Install and run *redis*

:: 

    yum install redis
    redis-server


Install
=======

Install the JBServer and JBrowse.  jb_setup.js ensures the sample data is loaded.

::

    git clone http://github.com/gmod/jbserver
    cd jbserver
    npm install
    npm install jbrowse
    npm install jbrowse or npm install gmod/jbrowse
    ./jb_setup.js
    npm install jbh-jblast
    node blast_getBlast.js    (installs the NCBI BLAST commands)
    todo: node blast_getSample.js   (setup sample database)

Run
===

Launch the server.

``sails lift``

From a web browser, access the application.

``http://localhost:1337/jbrowse``


