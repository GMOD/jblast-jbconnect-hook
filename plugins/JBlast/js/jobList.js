
function doGetJobs() {
    getJobs(function(data){
        jdata = $.parseJSON(data);

        //console.dir(jdata);

        // filter type: galaxy-job
        //console.log("jdata len",jdata.length);
        var i = jdata.length;
        while(i--) {
            if (jdata[i].type!=='galaxy-job')
                jdata.splice(i, 1);    
        }
        //console.log("jdata len",jdata.length);

        jdata.sort(function(a,b) {
            if (a.data.galaxy_data.hid > b.data.galaxy_data.hid) return -1;
            if (a.data.galaxy_data.hid < b.data.galaxy_data.hid) return 1;
            else return 0;
        });

        for (var x in jdata) {
            // filter out non galaxy-job type
            if (jdata[x].type === 'galaxy-job') {

                $("#j-hist-grid table").append("<tr id='"+jdata[x].id+"'><td class='state'>"
                    +getJobState(jdata[x].data.galaxy_data.state)+"</td><td>"
                    +jdata[x].data.galaxy_data.hid+"</td><td>"+jdata[x].data.galaxy_data.name+"</td></tr>");
            }
        }

    });
};


function getJobs(callback) {

    console.log("Load History");
    $.ajax({
        url: "/api/jobs/0..10000",
        dataType: "text",
        success: function (data) {
          callback(data);
        }
        // todo: handle errors
    });
};

// convert state info image or text

function getJobState(state){
    switch(state) {
        case "running":
            $("img.cogwheel").removeClass("hidden");        // turn on the tab progress cog
            return "<img style='width:20px' src='img/st_processing.gif' />";
        case "ok":
            return "<img style='width:20px' src='img/st_green_check.png' />";
        case "error":
            return "<img style='width:20px' src='img/st_red_x.png' />";
        case "queued":
        case "new":
            return "<span style='color:green;font-weight:bold'>"+state+"</span>";
        default:
            return state;
    }
}
