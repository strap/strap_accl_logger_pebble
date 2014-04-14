// ------------------------------
//  Start of Strap API
// ------------------------------
var strap_api_num_samples = 10;
var strap_api_url = "http://api.straphq.com/create/visit/with/";

var strap_api_timer_send = null;

// -----------------------
// #defines from strap.c
// -----------------------
var strap_api_const = {};
strap_api_const.KEY_OFFSET = 48000;
strap_api_const.T_TIME_BASE = 1000;
strap_api_const.T_TS = 1;
strap_api_const.T_X = 2;
strap_api_const.T_Y = 3;
strap_api_const.T_Z = 4;
strap_api_const.T_DID_VIBRATE = 5;
strap_api_const.T_ACTIVITY = 2000;
strap_api_const.T_LOG = 3000;
// -----------------------

var strap_api_can_handle_msg = function (data) {
    var sac = strap_api_const;
    if( (sac.KEY_OFFSET + sac.T_ACTIVITY).toString() in data) {
        return true;
    }
    if( (sac.KEY_OFFSET + sac.T_LOG).toString() in data) {
        return true;
    }
    
    return false;
}

var strap_api_clone = function(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = {};
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

var strap_api_log = function (data, min_readings, log_params) {
    var sac = strap_api_const;
    var lp = log_params;
    
    
    if( !((sac.KEY_OFFSET + sac.T_LOG).toString() in data)) {
        var convData = strap_api_convAcclData(data);
        var tmpstore = window.localStorage['strap_accl'];

        if(tmpstore){
            tmpstore = JSON.parse(tmpstore);
        }
        else {
            tmpstore = [];
        }

        tmpstore = tmpstore.concat(convData);

        if(tmpstore.length > min_readings) {
            window.localStorage.removeItem('strap_accl');
            var req = new XMLHttpRequest();
            req.open("POST", strap_api_url, true);

            var tz_offset = new Date().getTimezoneOffset() / 60 * -1;
            var query = "app_id=" + lp['app_id']
                + "&resolution=" + (lp['resolution'] || "")
                + '&useragent=' + (lp['useragent']  || "")
                + '&action_url=' + 'STRAP_API_ACCL'
                + '&visitor_id=' + (lp['visitor_id'] || Pebble.getAccountToken())
                + '&visitor_timeoffset=' + tz_offset
                + '&accl=' + encodeURIComponent(JSON.stringify(tmpstore))
                + '&act=' + ((tmpstore.length > 0)?tmpstore[0].act:"UNKNOWN");
                
            //console.log('query: ' + query);
            
            //Send the proper header information along with the request
            req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            req.setRequestHeader("Content-length", query.length);
            req.setRequestHeader("Connection", "close");

            req.onload = function(e) {
                if (req.readyState == 4 && req.status == 200) {
                    if(req.status == 200) {
                        console.log("Sent");
                    } else { console.log("Error"); }
                }
            }
            req.send(query);
        }
        else {
            window.localStorage['strap_accl'] = JSON.stringify(tmpstore);
        }
    }
    else {
        var req = new XMLHttpRequest();
        req.open("POST", strap_api_url, true);

        var tz_offset = new Date().getTimezoneOffset() / 60 * -1;
        var query = "app_id=" + lp['app_id']
            + "&resolution=" + (lp['resolution'] || "")
            + '&useragent=' + (lp['useragent']  || "")
            + '&action_url=' + data[(KEY_OFFSET + T_LOG).toString()];
            + '&visitor_id=' + (lp['visitor_id'] || Pebble.getAccountToken())
            + '&visitor_timeoffset=' + tz_offset;
            
        //console.log('query: ' + query);
        
        //Send the proper header information along with the request
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        req.setRequestHeader("Content-length", query.length);
        req.setRequestHeader("Connection", "close");

        req.onload = function(e) {
            if (req.readyState == 4 && req.status == 200) {
                if(req.status == 200) {
                    console.log("Sent");
                } else { console.log("Error"); }
            }
        }
        req.send(query);
    }
}

var strap_api_convAcclData = function (data) {
    var sac = strap_api_const;
    
    
    var convData = [];
    var time_base = parseInt(data[(sac.KEY_OFFSET + sac.T_TIME_BASE).toString()]);
    for(var i = 0; i < strap_api_num_samples; i++) {
        var point = sac.KEY_OFFSET + (10 * i);
    
        var ad = {};
        // ts key
        var key = (point + sac.T_TS).toString();
        ad.ts = data[key] + time_base;
        
        // x key
        key = (point + sac.T_X).toString();
        ad.x = data[key];
        
        // y key
        key = (point + sac.T_Y).toString();
        ad.y = data[key];
        
        // z key
        key = (point + sac.T_Z).toString();
        ad.z = data[key];
        
        // did_vibrate key
        key = (point + sac.T_DID_VIBRATE).toString();
        ad.vib = (data[key] == "1")?true:false;
        
        ad.act = data[(sac.KEY_OFFSET + sac.T_ACTIVITY).toString()];
        
        convData.push(ad);
    }

    
    return convData;
};

// ------------------------------
//  End of Strap API
// ------------------------------
