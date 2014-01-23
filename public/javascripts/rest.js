$.ajaxSetup ({
cache: false
});

function timeentry(direction, datetime) {
    // setup the date & time
    var dt;
    if(datetime === 'self') {
        dt = moment();
        dt.millisecond(0);
        dt.second(0);
        dt = dt.toISOString();
    } else {
        dt = moment(datetime, 'DD.MM.YYYY HH:mm').toISOString();
    }
    
    $.ajax({
    type: 'POST',
    url: '/entry',
    dataType: 'json',
    data: { 'direction': direction, 'datetime': dt }
    })
    .done(function(timeentry) {
        var sDate = moment(timeentry.entry_date).format('DD.MM.YYYY');
        var sTime = moment(timeentry.entry_date).format('HH:mm');
        
        result.innerHTML = timeentry.direction;
        result.innerHTML += " am ";
        result.innerHTML += sDate;
        result.innerHTML += " um ";
        result.innerHTML += sTime
        size.innerHTML = timeentry.size;
    }, 'json')
    .error(function(err) {
        result.innerHTML = "Error (" + err.status + "): " + err.responseText;
    });
    
}

function maintainHoliday(date, holiday) {
    var isHoliday = (holiday !== 'on');

    $.ajax({
    type: 'PUT',
    url: '/admin/holiday',
    dataType: 'json',
    data: { 'holiday': isHoliday, 'date': date }
    })
    .done(function(response) {
        result.innerHTML = 'holiday set/reset successfully: ' + response._id;
    }, 'json')
    .error(function(err) {
        result.innerHTML = "Error (" + err.status + "): " + err.responseText;
    }); 
}

function deleteAllTimeEntries() {
    $.ajax({
    type: 'DELETE',
    url: '/entry',
    dataType: 'json'
    })
    .done(function(response) {
        result.innerHTML = 'deleted ' + response.size + ' time entries';
    })
    //    .success(function(response) { alert("success: " + response.count); })
    .error(function(err) { alert("error: " + err.status + " (" + err + ")"); })
    //    .fail(function(err) { alert("failed: " + err.status + " (" + err.statusText + ")"); })
    //    .always(function() { alert("always"); })
}

function calculateStats() {
    $.ajax({
    type: 'PUT',
    url: '/stats',
    dataType: 'json'
    })
    .done(function(response) {
        result.innerHTML = 'updated statistics: ' + response;
    })
    .error(function(err) { alert("error: " + err.status + " (" + err + ")"); })
}

function getTimeEntriesByDate(dt) {

    result.innerHTML = '';
    getBusyTime(dt, function(err, duration) {
        
        if(err) {
            result.innerHTML = "Error (" + err.status + "): " + err.responseText;
        }
        
        $.ajax({
        type: 'GET',
        url: '/entry/dt/' + dt,
        dataType: 'json',
        })
        .done(function(timeentries) {
            var html = '<b>Datum: ' + moment(dt).format('DD.MM.YYYY');
            if(duration) {
                html += ' - Anwesenheit: ' + moment(duration.duration-60*60*1000).format('HH:mm:ss') + ' Stunden';
            }
            html += '<table><th>Datum</th>';
            html += '<th>Kommen/Gehen</th>';
            html += '<th>Letzte Änderung</th>';
            html += '<th>Bearbeiten/Löschen</th>';
            timeentries.forEach(function(entry) {
                html += '<tr>';
                html += '<td>' + moment(entry.entry_date).format('HH:mm') + '</td>';
                html += '<td>' + entry.direction + '</td>';
                html += '<td>' + moment(entry.last_changed).format('DD.MM.YYYYY HH:mm:ss') + '</td>';
                html += '<td>';
                html += '<input type="button" value="bearbeiten" onclick="editTimeEntryById(\'' + entry._id + '\');">'
                html += '<input type="button" value="löschen" onclick="deleteTimeEntryById(\'' + entry._id + '\');">'
                html += '</td>';
                html += '</tr>';
            })
            html += '</table>';
            data_by_date.innerHTML = html;
            
        }, 'json')
        .error(function(err) {
            result.innerHTML = "Error (" + err.status + "): " + err.responseText;
        });
        
    });
    
}

function editTimeEntryById(id) {
    
    $.ajax({
    type: 'GET',
    url: '/entry/' + id,
    dataType: 'json',
    })
    .done(function(timeentry) {
        var html = '<b>ID: ' + timeentry._id + '</b><table>';
        html += '<tr><td>Datum</td><td><input id="entry_date" type="text" value="' + moment(timeentry.entry_date).format('DD.MM.YYYY HH:mm') + '" /></td></tr>';
        html += '<tr><td>Kommen/Gehen</td><td><input id="direction" type="text" value="' + timeentry.direction + '" /></td></tr>';
        html += '<tr><td>Letzte Änderung</td><td>' + moment(timeentry.last_changed).format('DD.MM.YYYY HH:mm') + '</td></tr>';
        html += '<tr><td colspan="2"><input type="button" value="übernehmen" onclick="storeTimeEntryById(\'' + timeentry._id + ', $(#direction), \');"></td></tr>'
        html += '</table>';
        dialog.innerHTML = html;
    }, 'json')
    .error(function(err) {
        return err;
    });
    
}

function getBusyTime(dt, callback) {
    
    $.ajax({
    type: 'GET',
    url: '/entry/busy/' + dt,
    dataType: 'json',
    })
    .done(function(duration) {
        callback(null, duration);
    }, 'json')
    .error(function(err) {
        callback(err);
    })
    ;
    
}

function storeTimeEntryById(id, entry_date, direction) {
    
    alert(id + ", " + entry_date + ", " + direction)
    
    $.ajax({
    type: 'PUT',
    url: '/entry/' + id,
    dataType: 'json',
    data: { 'direction': direction, 'datetime': dt }
    })
    .done(function(response) {
        result.innerHTML = 'stored Time Entry ' + response;
    })
    .error(function(err) {
        result.innerHTML = "Error (" + err.status + "): " + err.responseText;
    })
}

function deleteTimeEntryById(id) {
    
    $.ajax({
    type: 'DELETE',
    url: '/entry/' + id,
    dataType: 'json',
    })
    .done(function(response) {
        result.innerHTML = 'deleted Time Entry ' + response;
    })
    .error(function(err) {
        result.innerHTML = "Error (" + err.status + "): " + err.responseText;
    })
    
}