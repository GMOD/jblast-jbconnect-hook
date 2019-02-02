******
JBlast
******

**JBlast - A BLAST service for JBConnect and JBrowse**

JBlast (jblast-jbconnect-hook) is JBConnect hook module. It contains both server-side integration with 
JBConnect and JBrowse that enables Blast analysis that is tightly integrated with JBrowse.   
JBlast can execute stand-alone NCBI blast commands directly, or it can be configured to use Galaxy for workflow processing. 
Through the JBrowse user interface the user can choose to submit an existing feature as a blast query or highlight a 
region to blast. The user can monitor blast execution processing through JBConnect’s job queue 
and the blast search results will appear directly as an inserted track in the track selector.  
The resulting hits can be filtered through a Filter Panel. The details of the hit can further be 
displayed in the Feature Details dialog box.


.. image:: img/filter-panel.jpg


**JBlast User Quick Tutorial**

.. raw:: html

    <div style="position: relative; padding-bottom: 15%; height: 0; overflow: hidden; max-width: 100%; height: auto;">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/SnJ5sewHJBk" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>


**JBlast provides the following functionality:**

+-------------------------------------------------------------------------------+
| Can leverage Galaxy Server for Blast Analysis or use                          |
| stand-alone NCBI Blast tools                                                  |
+-------------------------------------------------------------------------------+
| Basic workflow abstraction and Monitoring                                     |
+-------------------------------------------------------------------------------+

**The Client-Side JBlast plugin intgration with JBrowse:**

+-------------------------------------------------------------------------------+
| Submit region or existing feature for blast search                            |
+-------------------------------------------------------------------------------+
| Inject result tracks into existing configuration with persistence.            |
+-------------------------------------------------------------------------------+
| Dynamically filter Blast results and save results.                            |
+-------------------------------------------------------------------------------+
| Extended feature details with blast results                                   |
+-------------------------------------------------------------------------------+


Contents
========

.. toctree::
   :maxdepth: 2

   quick_start
   features
   setup
   api


