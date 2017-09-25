******
JBlast
******

**JBlast - A BLAST analysis service for JBServer and JBrowse**

JBlast is JBServer hook module (jbh).  It contains both server-side integration
with JBServer as well as a client-side plugin.

JBlast provides the following functionality:

* Leverages Galaxy Server for tool execution.
* A stand-alone NCBI Blast tools is also provided.
* Blast Workflow Execution and Monitoring
* Blast Filter REST API

The Client-Side JBrowse plugin integrates with the server component:

* Submit region for blast search
* Inject result track into trackList.json w/ dynamic track update in track selector
* Dynamic Filter Panel
* Blast Feature Detail Panel


Contents
========

.. toctree::
   :maxdepth: 2

   quick_start
   features
   setup
   api


