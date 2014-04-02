var startPos;
var lastBookingDate;
var firstload = 'true';

var WORK_POS = {latitude:49.44843, longitude:11.09182};
var HOME_POS = {latitude:49.51414, longitude:10.87549};

if (navigator.geolocation) {
    
    navigator.geolocation.getCurrentPosition(function(position) {
        startPos = position;
        $('#startLat').text(startPos.coords.latitude);
        $('#startLon').text(startPos.coords.longitude)
    }, function(error) {
        var msg;
        switch(error.code) {
            case 0: msg = 'unknown error';
            case 1: msg = 'permission denied';
            case 2: msg = 'position unavailable (error response from locaton provider)';
            case 3: msg = 'timed out';
        }
        alert("Error occurred. Error code: " + error.code + " " + msg);
    });
    
    navigator.geolocation.watchPosition(function(position) {
        $('#currentLat').text(position.coords.latitude);
        $('#currentLon').text(position.coords.longitude);
        $('#accuracy').text(position.coords.accuracy);
        $('#speed').text(position.coords.speed/1);
        $('#speedKMH').text(position.coords.speed*3.6);
        
        var dist = formatDistance(calculateDistance(startPos.coords.latitude, startPos.coords.longitude, position.coords.latitude, position.coords.longitude));
        $('#distanceKm').text(dist.kilometer);
        $('#distanceM').text(dist.meter);
        
        var distWork = formatDistance(calculateDistance(WORK_POS.latitude, WORK_POS.longitude, position.coords.latitude, position.coords.longitude));
        $('#distanceWorkKm').text(distWork.kilometer);
        $('#distanceWorkM').text(distWork.meter);
        
        var distHome = formatDistance(calculateDistance(HOME_POS.latitude, HOME_POS.longitude, position.coords.latitude, position.coords.longitude));
        $('#distanceHomeKm').text(distHome.kilometer);
        $('#distanceHomeM').text(distHome.meter);
        $('#distanceHomeM').text(firstload);
        if(firstload === 'true') {
            //            alert('it\'s my first load');
            firstload = 'false';
        }
        // book in or out at work
        if(distWork.kilometer == 17 && distWork.meter <= 900) {
            if(typeof(lastBookingDate) == 'undefined') {
                lastBookingDate = moment();
            }
            /*
            alert(lastBookingDate.format('DD.MM.YYYY HH:mm:ss') + " ................. " + moment(lastBookingDate).add('hours', '1').format('DD.MM.YYYY HH:mm:ss'));
            alert(JSON.stringify(distWork));
             */
        }
    });
} else {
    $('#startLat').text('your browser does not support geo location');
}


// Reused code - copyright Moveable Type Scripts - retrieved May 4, 2010.
// http://www.movable-type.co.uk/scripts/latlong.html
// Under Creative Commons License http://creativecommons.org/licenses/by/3.0/
function calculateDistance(lat1, lon1, lat2, lon2) {
    var R = 6371; // km -> m
    var dLat = (lat2-lat1).toRad();
    var dLon = (lon2-lon1).toRad();
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d;
}

function formatDistance(distOrig) {
    var distKm = parseInt(distOrig);
    var distM = (distOrig - distKm) * 1000;
    distM = Math.round(distM * 100) / 100;
    
    return {kilometer:distKm, meter:distM};
}
Number.prototype.toRad = function() {
    return this * Math.PI / 180;
}
