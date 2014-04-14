var conf_url = "http://homenet.monceaux.org:8443/accl/conf.html";

// ------------------------------
//  Start of Strap API
// ------------------------------
var strap_api_num_samples=10;var strap_api_url="http://api.straphq.com/create/visit/with/";var strap_api_timer_send=null;var strap_api_const={};strap_api_const.KEY_OFFSET=48e3;strap_api_const.T_TIME_BASE=1e3;strap_api_const.T_TS=1;strap_api_const.T_X=2;strap_api_const.T_Y=3;strap_api_const.T_Z=4;strap_api_const.T_DID_VIBRATE=5;strap_api_const.T_ACTIVITY=2e3;strap_api_const.T_LOG=3e3;var strap_api_can_handle_msg=function(data){var sac=strap_api_const;if((sac.KEY_OFFSET+sac.T_ACTIVITY).toString()in data){return true}if((sac.KEY_OFFSET+sac.T_LOG).toString()in data){return true}return false};var strap_api_clone=function(obj){if(null==obj||"object"!=typeof obj)return obj;var copy={};for(var attr in obj){if(obj.hasOwnProperty(attr))copy[attr]=obj[attr]}return copy};var strap_api_log=function(data,min_readings,log_params){var sac=strap_api_const;var lp=log_params;if(!((sac.KEY_OFFSET+sac.T_LOG).toString()in data)){var convData=strap_api_convAcclData(data);var tmpstore=window.localStorage["strap_accl"];if(tmpstore){tmpstore=JSON.parse(tmpstore)}else{tmpstore=[]}tmpstore=tmpstore.concat(convData);if(tmpstore.length>min_readings){window.localStorage.removeItem("strap_accl");var req=new XMLHttpRequest;req.open("POST",strap_api_url,true);var tz_offset=(new Date).getTimezoneOffset()/60*-1;var query="app_id="+lp["app_id"]+"&resolution="+(lp["resolution"]||"")+"&useragent="+(lp["useragent"]||"")+"&action_url="+"STRAP_API_ACCL"+"&visitor_id="+(lp["visitor_id"]||Pebble.getAccountToken())+"&visitor_timeoffset="+tz_offset+"&accl="+encodeURIComponent(JSON.stringify(tmpstore))+"&act="+(tmpstore.length>0?tmpstore[0].act:"UNKNOWN");req.setRequestHeader("Content-type","application/x-www-form-urlencoded");req.setRequestHeader("Content-length",query.length);req.setRequestHeader("Connection","close");req.onload=function(e){if(req.readyState==4&&req.status==200){if(req.status==200){console.log("Sent")}else{console.log("Error")}}};req.send(query)}else{window.localStorage["strap_accl"]=JSON.stringify(tmpstore)}}else{var req=new XMLHttpRequest;req.open("POST",strap_api_url,true);var tz_offset=(new Date).getTimezoneOffset()/60*-1;var query="app_id="+lp["app_id"]+"&resolution="+(lp["resolution"]||"")+"&useragent="+(lp["useragent"]||"")+"&action_url="+data[(sac.KEY_OFFSET+sac.T_LOG).toString()]+"&visitor_id="+(lp["visitor_id"]||Pebble.getAccountToken())+"&visitor_timeoffset="+tz_offset;req.setRequestHeader("Content-type","application/x-www-form-urlencoded");req.setRequestHeader("Content-length",query.length);req.setRequestHeader("Connection","close");req.onload=function(e){if(req.readyState==4&&req.status==200){if(req.status==200){console.log("Sent")}else{console.log("Error")}}};req.send(query)}};var strap_api_convAcclData=function(data){var sac=strap_api_const;var convData=[];var time_base=parseInt(data[(sac.KEY_OFFSET+sac.T_TIME_BASE).toString()]);for(var i=0;i<strap_api_num_samples;i++){var point=sac.KEY_OFFSET+10*i;var ad={};var key=(point+sac.T_TS).toString();ad.ts=data[key]+time_base;key=(point+sac.T_X).toString();ad.x=data[key];key=(point+sac.T_Y).toString();ad.y=data[key];key=(point+sac.T_Z).toString();ad.z=data[key];key=(point+sac.T_DID_VIBRATE).toString();ad.vib=data[key]=="1"?true:false;ad.act=data[(sac.KEY_OFFSET+sac.T_ACTIVITY).toString()];convData.push(ad)}return convData};

// ------------------------------
//  End of Strap API
// ------------------------------

var convConf = function(conf) {

    var confs = [];
    for (var key in conf) {
       confs.push(key);
       confs.push(conf[key]);
    }
    var s = confs.join(",");
    return s;
};

Pebble.addEventListener("ready",
    function(e) {
        var dconf = "RUNNING,Running,JOGGING,Jogging,WALKING,Walking,SLEEPING,Sleeping,BUS,Riding Bus,SIT,Sitting,STANDING,Standing,DRIVING,Driving";
        if(window.localStorage['conf']) {
            dconf = convConf(JSON.parse(window.localStorage['conf']));
        }

        var transactionId = Pebble.sendAppMessage( { "20": dconf },
          function(e) {
            console.log("Successfully delivered message with transactionId="
              + e.data.transactionId);
          },
          function(e) {
            console.log("Unable to deliver message with transactionId="
              + e.data.transactionId
              + " Error is: " + e.error.message);
          }
        );
    }
);

Pebble.addEventListener("appmessage",
    function(e) {
        //console.log("appmessage: " + JSON.stringify(e.payload));
        // Strap API: Developer updates these parameters to fit
        var strap_params = {
            app_id: "ChwgjRPi4Zx2fQQoH",
            resolution: "144x168",
            useragent: "PEBBLE/2.0"
        };

        // -------------------------
        //  Strap API inclusion in appmessage
        //  This allows Strap to process Strap-related messages
        //  DO NOT EDIT
        // -------------------------
        if(strap_api_can_handle_msg(e.payload)) {
            clearTimeout(strap_api_timer_send);
            var params = strap_api_clone(strap_params);
            strap_api_log(e.payload, 200, params);
            strap_api_timer_send = setTimeout(function() {
                strap_api_log({}, 0, params);
            }, 10 * 1000);
        }
        // -------------------------
          
    }
);

Pebble.addEventListener("webviewclosed",
  function(e) {
    if(e.response){
        var configuration = JSON.parse(decodeURIComponent(e.response));
        //console.log(convConf(configuration));
        //console.log("Configuration window returned: " +  JSON.stringify(configuration));
        
        window.localStorage['conf'] = JSON.stringify(configuration);
        var dconf = convConf(JSON.parse(window.localStorage['conf']));
        var transactionId = Pebble.sendAppMessage( { "20": dconf },
              function(e) {
                console.log("Successfully delivered message with transactionId="
                  + e.data.transactionId);
              },
              function(e) {
                console.log("Unable to deliver message with transactionId="
                  + e.data.transactionId
                  + " Error is: " + e.error.message);
              }
            );
     }
     else {
        window.localStorage.removeItem('conf');
     }
     
  }
);

Pebble.addEventListener("showConfiguration",
  function(e) {
    //Pebble.openURL('data:text/html;charset=utf-8,<!DOCTYPE HTML PUBLIC "-%2F%2FW3C%2F%2FDTD HTML 4.0%2F%2FEN">%0D%0A<html lang%3D"en">%0D%0A <head>%0D%0A  <title>Test<%2Ftitle>%0D%0A  <style type%3D"text%2Fcss">%0D%0A  <%2Fstyle>%0D%0A <%2Fhead>%0D%0A <body>%0D%0A%0D%0A%0D%0A<a href%3D"no-javascript.html" title%3D"Get some foo!" id%3D"foo">Show me some foo<%2Fa>%0D%0A<script>%0D%0Avar el %3D document.getElementById("foo")%3B%0D%0Ael.onclick %3D showFoo%3B%0D%0A%0D%0A%0D%0Afunction showFoo() {%0D%0A  window.location.href %3D "pebblejs%3A%2F%2Fclose%23success"%0D%0A  return false%3B%0D%0A}%0D%0A<%2Fscript>%0D%0A <%2Fbody>%0D%0A<%2Fhtml>%0D%0A');
    var dconf = "RUNNING,Running,JOGGING,Jogging,WALKING,Walking,SLEEPING,Sleeping,BUS,Riding Bus,SIT,Sitting,STANDING,Standing,DRIVING,Driving";
    if(window.localStorage['conf']) {
        dconf = convConf(JSON.parse(window.localStorage['conf']));
    }
    var hash = encodeURIComponent(dconf);
    Pebble.openURL(conf_url+"#"+hash);
  }
);
