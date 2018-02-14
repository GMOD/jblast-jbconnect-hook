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

The aggregate config file is the merged config of JBServer and its installed jbh- (hook)
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



JBlast jbutil Command
=====================

``jbutil`` is a setup/configuration utility for JBServer.  jbh-hook can extend
``jbutil`` command options. (see: :ref:`jbs-hooks-extend`)

This example shows that ``jbh-jblast`` adds a number of commands to ``jbutil``

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

--setupindex
------------

This writes the demo index.html file in the JBrowse directory.

--setuphistory

this option sets up the history name in the config file.  This option requires
having configured the Galaxy API key in config. 


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
They are made available as route by the JBServer framework and are only accessible at runtime.*

See :ref:`jblast-integrated-gui` for more details.

------

Setup Galaxy Integration
========================

Galaxy integration is optional and allows for using Galaxy workflows to process BLAST searches.
Note that is is a demonstration of Galaxy integration and not intended to be a robust solution.

We generally assume that Galaxy and JBServer are installed in side-by-side directories.
For example:
::
    /var
       /www
           /galaxy
           /jbserver

Getting JBServer fully integrated with Galaxy will require several start/stop instances of Galaxy.


Install Galaxy
**************

Instructions for installing galaxy: `Get Galaxy <https://galaxyproject.org/admin/get-galaxy/>`_

Run galaxy: ``sh run.sh``  (From galaxy dir. First time run will take a while)

By default Galaxy is hosted on port 8080: ``http://localhost:8080``

Create a user with admin privilage
**********************************

Register a new user (**User** Menu --> Register).

.. image:: img/blast-newuser.png


Configure JBServer with Galaxy Info
***********************************

In the ``jbrowse`` directory, edit ``config/globals.js`` and create a ``galaxy:`` section under ``jbrowse:`` section.  Add the Galaxy installation path.

::

    module.exports = {
      jbrowse: {
        galaxy: {
          galaxyPath: '/var/www/galaxy'
        }
      }
    }

These settings will override any settings in ``node_modules/jbh-jblast/config/globals.js`` and ``jbserver/config/globals.js``. 

From the JBrowse directory, type ``./jbutil --setuptools``

This will copy some JBlast specific Galaxy tools into the ``galaxy`` directory as as well as replace 
``config.galaxy.ini`` in the ``galaxy`` directory.

In ``galaxy`` directory, add the following line to ``congfig/galaxy.ini`` add the user email for the user you created as an admin:

::
    admin_users = me-user@gmail.com

Start Galaxy again from the galaxy directory (``sh run.sh``)

Now you should see and **Admin** menu appear in Galaxy.

Generating the Galaxy API key
*****************************

Create an API key (**User** Menu --> Preference), then select **Manage API Key**, click the **Create a new key** button.

.. image:: img/galaxy-apikey.png

In the JBlast directory, add the API key to config/globals.js under the galaxy: section.

::

    module.exports = {
      jbrowse: {
        galaxy: {
          galaxyPath: '/var/www/galaxy',
          galaxyAPIKey: "c7be32db9329841598b1a5705655f633"
        }
      }
    }

Now, restart galaxy: ``sh run.sh``

Install NCBI Blast+ Tools
*************************

At the same level as ``jbserver`` and ``galaxy`` directories, create a directory called ``shed_tools``, making sure it has the same permissions as the ``galaxy`` and ``jbserver`` directories.

Select the **Admin** menu and **Search Tool Shed** from the left side bar.

Select the **Galaxy Main Tool Shed**: 

.. image:: img/galaxy-main-toolshed.PNG

In the search box enter ``ncbi_blast_plus``.

.. image:: img/galaxy-ncbi-install-blast.PNG

When you come to the Install to Galaxy button, click it.

When you arrive at the screen with **Add new tool panel section**, type in "NCBI Blast+"

.. image:: img/galaxy-add-ncbi-toolpanel.PNG

Then click Install button.

The NCBI blast tools and dependencies will proceed to be installed.

Sometimes you will have to do this procedure a 2nd or 3rd time to ensure all the dependencies are installed.


Install demo workflows
************************

Install sample workflows used in demo.  (this step require the API key to be configured and Galaxy
should be running.)

``./jbutil --setupworkflows``


Registering a Blast Database
****************************

Download the blast database if you haven't already done it.

::

   ./bin/blast_downloadDb.js htgs.05   (setup sample database)
           // you can also download the full "htgs" database, but this will
           // take a while on slower lines. (ie. "./blast_downloadDb.js htgs" )

This downloads and installs **"htgs"** BLAST database from ``ftp://ftp.ncbi.nlm.nih.gov/blast/db/``
into blastdb/htgs directory.  

In the ``galaxy`` directory, edit ``tool-data/blastdb.loc``.

Add this line to the end of the file:

``htgs{tab}High Throughput Genomic Sequences (htgs){tab}/var/www/jbserver/blastdb/htgs/htgs``

Restart Galaxy: ``sh run.sh``

Lift sails: ``sails lift``



