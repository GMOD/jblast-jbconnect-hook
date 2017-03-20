

function doGetQueue() {
    
    var typeToWatch = 'galaxy-workflow-watch';
    
    getJobs(function(data){
        jdata = $.parseJSON(data);

        //console.log(jdata.length, jdata);

        // filter type: galaxy-job
        //console.log("jdata len",jdata.length);
        var i = jdata.length;
        while(i--) {
            if (jdata[i].type!==typeToWatch)
                jdata.splice(i, 1);    
        }
        console.log("jdata len",jdata.length,jdata);

        jdata.sort(function(a,b) {
            if (a.id > b.id) return -1;
            if (a.id < b.id) return 1;
            else return 0;
        });

        for (var x in jdata) {
            // filter out non galaxy-job type
            if (jdata[x].type === typeToWatch) {

                $("#j-hist-grid table").append("<tr id='"+jdata[x].id+"'>"
                    +"<td>"+jdata[x].id+"</td>"
                    +"<td class='state'>"+getQueState(jdata[x].state)+"</td><td>"
                    +jdata[x].progress+"</td><td>"+jdata[x].data.name+"</td></tr>");
            }
        }

    });
}

// convert state info image or text

function getQueState(state){
    switch(state) {
        case "active":
            $("img.cogwheel").removeClass("hidden");        // turn on the tab progress cog
            return "<img style='width:20px' src='img/st_processing.gif' />";
        case "complete":
            return "<img style='width:20px' src='img/st_green_check.png' />";
        case "failed":
            return "<img style='width:20px' src='img/st_red_x.png' />";
        default:
            return "<span style='color:red;font-weight:bold'>"+state+"</span>";
    }
}
