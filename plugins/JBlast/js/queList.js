function initQueue() {
    
    // subscribe to all job objects including new
    io.socket.get('/job', function(resData, jwres) {console.log(resData);});
    io.socket.get('/jobactive', function(resData, jwres) {console.log(resData);});

    // trigger on events
    io.socket.on('job', function(event){
        console.log('event job',event);
        var data = event.data;
        switch(event.verb) {
            case 'created':
                console.log('event job create',event.data.id,data);
                $('#j-hist-grid #head').after(
                        "<tr id='"+data.id+"'>"
                        +"<td>"+data.id+"</td>"
                        +"<td class='state' questate='"+getQueState(data.state)+"'></td>"
                        //+"<td class='progress'>"+data.progress+"</td>"
                        +"<td class='name'>"+data.data.name+"</td>"
                        +"</tr>");                
                        break;
            case 'updated':
                console.log('event update',data.id,data);
                $('#j-hist-grid #'+data.id+" .state").attr('questate',getQueState(data.state));
                $('#j-hist-grid #'+data.id+" .name").html(data.data.name);
                break;
            case 'destroyed':
                console.log('event remove',data.id,data);
                $("#j-hist-grid tr#"+data.id).remove();
                break;
                }
    });
    
    io.socket.on('jobactive', function(event){
        console.log('event jobactive',event);
        if (event.data.active===0) $("div.flapEx").removeClass("cogwheel");
        else $("div.flapEx").addClass("cogwheel");
    });    
    
    
    /*
     * queue events
     */
    /*
    io.socket.on('queue-active', function (data){
        console.log('event','queue-active',data);
        if (data.count===0) $("div.flapEx").removeClass("cogwheel");
        else $("div.flapEx").addClass("cogwheel");
    });		
    io.socket.on('queue-enqueue', function (data){
        console.log('event','queue-enqueue',data.type,data.id,data);
        $('#j-hist-grid #head').after(
                "<tr id='"+data.id+"'>"
                +"<td>"+data.id+"</td>"
                +"<td class='state' questate='"+getQueState(data.state)+"'></td>"
                +"<td class='progress'>"+data.progress+"</td>"
                +"<td class='name'>"+data.name+"</td>"
                +"</tr>");                
    });		
    io.socket.on('queue-start', function (data){
        console.log('event','queue-start',data.type,data.id,data);
        $('#j-hist-grid #'+data.id+" .state").attr('questate',getQueState(data.state));
        $('#j-hist-grid #'+data.id+" .name").html(data.data.name);
    });		
    io.socket.on('queue-failed', function (data){
        console.log('event','queue-failed',data.type,data.id,data);
        $('#j-hist-grid #'+data.id+" .state").attr('questate',getQueState(data.state));
        $('#j-hist-grid #'+data.id+" .name").html(data.data.name);
    });		
    io.socket.on('queue-failed-attempt', function (data){
        console.log('event','queue-failed-attempt',data.type,data.id,data);
        $('#j-hist-grid #'+data.id+" .state").attr('questate',getQueState(data.state));
        $('#j-hist-grid #'+data.id+" .name").html(data.data.name);
    });		
    io.socket.on('queue-progress', function (data){
        console.log('event','queue-progress',data.type,data.id,data);
        $('#j-hist-grid #'+data.id+" .progress").html(data.progress);
        if (typeof data.data !== 'undefined' && typeof data.data.name !== 'undefined')
            $('#j-hist-grid #'+data.id+" .name").html(data.data.name);
    });		
    io.socket.on('queue-complete', function (data){
        console.log('event','queue-complete',data.type,data.id,data);
        $('#j-hist-grid #'+data.id+" .state").attr('questate',getQueState(data.state));
        $('#j-hist-grid #'+data.id+" .name").html(data.data.name);
    });		
    io.socket.on('queue-remove', function (data){
        console.log('event','queue-remove',data.type,data.id,data);
        $("#j-hist-grid tr#"+data.id).remove();
    });
    /*
    io.socket.on('queue-promotion', function (data){
        console.log('event','queue-promotion',data.type,data.id,data);
    });		
    */    
    doGetQueue();
}

function doGetQueue() {
    
    var typeToWatch = 'workflow';
    
    getJobs(function(data){
        //jdata = $.parseJSON(data);
        jdata = JSON.parse(data);
        //console.log('jobs', jdata.length, jdata);

        // filter type: galaxy-job
        //console.log("jdata len",jdata.length);
        /*
        var i = jdata.length;
        while(i--) {
            if (jdata[i].type!==typeToWatch)
                jdata.splice(i, 1);    
        }
        */
        console.log("jobs ",jdata.length,jdata);

        jdata.sort(function(a,b) {
            if (a.id > b.id) return -1;
            if (a.id < b.id) return 1;
            else return 0;
        });

        for (var x in jdata) {
            // filter out non galaxy-job type
            //if (jdata[x].type === typeToWatch) {
                
                $("#j-hist-grid table").append(
                    "<tr id='"+jdata[x].id+"'>"
                    +"<td>"+jdata[x].id+"</td>"
                    //+"<td class='state'>"+getQueState(jdata[x].state,jdata[x])+"</td><td>"
                    +"<td class='state' questate='"+getQueState(jdata[x].state)+"'></td>"
                    //+"<td>"+jdata[x].progress+"</td>"
                    +"<td>"+jdata[x].data.name+"</td>"
                    +"</tr>");
            //}
        }

    });
}
function getJobs(callback) {

    //console.log("Load History");
    $.ajax({
        //url: "/api/jobs/0..10000",
        url: "/job",
        dataType: "text",
        success: function (data) {
          callback(data);
        }
        // todo: handle errors
    });
};

// convert state info image or text
/*
function getQueState(state,data){
    switch(state) {
        case "active":
            $("img.cogwheel").removeClass("hidden");        // turn on the tab progress cog
            return "<img style='width:20px' src='img/st_processing.gif' title='"+state+"' alt='"+state+"' />";
        case "complete":
            return "<img style='width:20px' src='img/st_green_check.png' title='"+state+"' alt='"+state+"' />";
        case "failed":
            var errmsg = "undefined error";
            if (typeof data !== 'undefined' && typeof data.error !== 'undefined') {
                errmsg = data.error;
                //if (errmsg.length > 100)
                //    errmsg = errmsg.substring(0, 99);
            }
            errmsg = state+' - '+errmsg;
            return "<img style='width:20px' src='img/st_red_x.png' title='"+errmsg+"' alt='"+errmsg+"' />";
        default:
            var st = state;
            if (typeof state === 'undefined') 
                st = state = typeof state;
            if (state.length > 3)
                st = state.substring(0, 3);
            
            return "<span style='color:red;font-weight:bold' title='"+state+"' alt='"+state+"'>"+st+"</span>";
    }
}
*/
function getQueState(state) {
    switch(state) {
        case 'active':
        case 'complete':
        case 'failed':
            return state;
        default: 
            return 'unknown';
    }
}


