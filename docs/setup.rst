**************
Setup Options
**************

.. _jbs-separate-dir:

JBrowse Installed In Separate Directory 
=======================================

If JBrowse is already installed in another directory, use this command to specify
the JBrowse directory after JBServer is installed.

``todo: ./jbutil --jbpath <path where JBrowse is installed>``


The JBrowse directory can also be configured manually. (See :ref:`jbs-globals-js`)
 


Configuration Files
===================

A number of configuration files are in the ``./config`` directory.  A few of the
more important ones (ones that JBSserver touches) are described mentioned in the table below.  
See `Sails Configuration <http://sailsjs.com/documentation/reference/configuration>`_
for a better description of all the files.

+-------------------------------+----------------------------------------------------------+
| :ref:`jbs-globals-js`         | global configuration file                                |
+-------------------------------+----------------------------------------------------------+
| http.js                       | custom middleware and /jbrowse route is setup here.      |
+-------------------------------+----------------------------------------------------------+
| :ref:`libroutes.js`           | library routes (non-sails)                               |
+-------------------------------+----------------------------------------------------------+
| passport.js, policies.js      | passport framework and auth policies config              |
+-------------------------------+----------------------------------------------------------+
| routes.js                     | various route config                                     |
+-------------------------------+----------------------------------------------------------+
| connections.js                | choice of database - local, mongo, mysql, ...            |
|                               | (we use local by default.)  The DB file is in the        |
|                               | ``./data/localDiskDb.db``.                               |
+-------------------------------+----------------------------------------------------------+



.. _jbs-globals-js

globals.js
----------

Modify the configuration file as necessary.

To view aggregate configuration: ``./jbutil --config``

The aggregate config file is the merged config of JBServer and its installed jbh- (hook)
modules.

Edit config file: ``nano config/globals.js``

:: 

    jbrowse: {
        jbrowseRest: "http://localhost:1337",       // path accessible by web browser
        jbrowsePath: jbPath,                        // or point to jbrowse directory (ie. "/var/www/jbrowse/") 
        routePrefix: "jbrowse",                     // jbrowse is accessed with http://<addr>/jbrowse
        dataSet: [
            {
                dataPath: "sample_data/json/volvox" // datasets.  
            }
        ]
    }



.. _jbs-hook-install:

Installing JBServer jbh-hooks
=============================

A 'JBServer Hook' is basically an *installable sails hook* with specific methods for
extending JBServer.  JBServer hooks must have the prefix ``jbh-`` prepended to the name.
For example: jbh-jblast.  When the hook is installed (i.e. ``npm install jbh-jblast``).  JBServer
will automatically integrate a number of features of the hook directly into JBServer upon ``sails lift``.

The jbh- hook can extend JBServer in the following ways:

* Extend models, controllers, policies and services
* Integrated client-side JBrowse plugins injection
* Integrated client-side npm module injection
* Integrated configuration tool (jbutil)
* Aggregated configurations


Installing a hook:

``npm install jbh-<hook name>`` (i.e. jbh-jblast)


For detailed info on jbh-hooks, see: :ref:`jbs-hooks`



