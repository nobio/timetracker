/*
 * takes the date and removes all time components
 * date expected to be a moment object
 */
exports.stripdownToDate = function(date) {
    var d = date;
    d.millisecond(0);
    d.second(0);
    d.minutes(0);
    d.hours(0);
    
    return d;
}

/*
 * checks if an object is empty; this is something different to undefined or null (sigh...)
 */
exports.isEmpty = function(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}