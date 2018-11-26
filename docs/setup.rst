**************
Setup Options
**************

Setup Galaxy Server for Blast processing.

Configuration Files
===================

.. _jbl-globals-js

globals.js
----------

Modify the configuration file as necessary.

To view aggregate configuration: ``./jbutil --config``

The aggregate config file is the merged config of JBConnect and its installed jbconnect-hook-*
modules.

Edit config file: ``nano config/globals.js``

:: 

    module.exports.globals = {
        jbrowse: {
            galaxy: {
                galaxyUrl: "http://localhost:8080",                 // URL of Galaxy

                galaxyPath: "/var/www/html/galaxy",                 // path of Galaxy
                //galaxyPath: "/var/www/html/galaxy_jblast",        // path of Galaxy, if docker

                galaxyAPIKey: "c7be32db9329841598b1a5705655f633",   //

                // jblast will use this Galaxy history
                historyName: "Unnamed history"                      // default history name
            },
            jblast: {
                blastResultPath: "jblastdata",                      
                blastResultCategory: "JBlast Results",
                insertTrackTemplate: "inMemTemplate.json",
                import: ["blastxml"]
            }
        }
    };

* ``blastResultPath`` is the sub directory within the dataset directory where the blast results are stored
* ``blastResultCategory`` is the name of the JBrowse track selectory category.
* ``insertTrackTemplate`` is the track insertion template.
* ``import`` is the file extension to process from the Galaxy workflow.



Get Galaxy API Key
==================

.. image:: img/galaxy-apikey.png


JBlast jbutil Command
=====================

``jbutil`` is a setup/configuration utility for JBConnect. JBConnect hooks can extend
``jbutil`` command options. (see: :ref:`jbs-hooks-extend`)

This example shows that ``jbconnect-hook-jblast`` adds a number of commands to ``jbutil``

::

    $ ./jbutil --help
    Usage: jbutil [OPTION]
          --config            display merged config
          --setupworkflows    (jblast) [install|<path>] "install" project wf, or specify .ga file 
          --setuptools        (jblast) setup jblast tools for galaxy
          --setupdata         (jblast) setup data and samples
      -h, --help              display this help




--setupworkflows
----------------

This option setus up sample JBlast workflows in galaxy.
This requires having configured the Galaxy API key in config.

--setuptools
------------

This option sets up Jblast tools for Galaxy.  After this is called, Galaxy will
need to be restarted.

*Note: NCBI Blast tools are not installed by the ``jbutils --setuptools`` script. 
the user must manually install these through the Tool Shed as admin.*


--setupdata
-----------

This options sets up samples and sample data for JBlast.



JBlast Plugin
=============

JBlast has integrated GUI features that must be enabled with by installing the ``JBlast`` plugin
and the ``JBClient`` on the client side.

In ``trackList.json``, within the dataset's path, add ``JBlast`` and ``JBClient`` plugin to the configuration.

::

  "plugins": [
    "JBClient",                    <-----           
    "JBlast",                      <-----

    "NeatHTMLFeatures",
    "NeatCanvasFeatures",
    "HideTrackLabels"
  ],

*Note: the JBlast and JBClient plugins are not physically in the JBrowse plugin directory.
They are made available as route by the JBConnect framework and are only accessible at runtime.*

See :ref:`jblast-integrated-gui` for more details.

------

Setup Galaxy Integration
========================

Galaxy integration is optional and allows for using Galaxy workflows to process BLAST searches.
Note that is is a demonstration of Galaxy integration and not intended to be a robust solution.

We generally assume that Galaxy and JBConnect are installed in side-by-side directories.
For example:
::
    /var
       /www
           /galaxy
           /jbconnect

Getting JBConnect fully integrated with Galaxy will require several start/stop instances of Galaxy.


Install Galaxy
**************

Instructions for installing galaxy: `Get Galaxy <https://galaxyproject.org/admin/get-galaxy/>`_

``git clone -b release_17.09 https://github.com/galaxyproject/galaxy.git`` (tested)

Run galaxy: ``sh run.sh``  (From galaxy dir. First time run will take a while)

By default Galaxy is hosted on port 8080: ``http://localhost:8080``

Create a user with admin privilage
**********************************

Register a new user (**User** Menu --> Register).

.. image:: img/galaxy-newuser.png


