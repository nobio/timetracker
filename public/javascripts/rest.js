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

function maintainHoliday(date, holyday) {
	alert(date + " " + holyday);
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

function getTimeEntriesByDate(dt) {

    $.ajax({
    type: 'GET',
    url: '/entry/dt/' + dt,
    dataType: 'json',
    })
    .done(function(timeentries) {
        var html = '<b>Datum: ' + moment(dt).format('DD.MM.YYYYY') + '</b><table>';
        html += '<th>Datum</th>';
        html += '<th>Kommen/Gehen</th>';
        html += '<th>Feiertag</th>';
        html += '<th>Letzte Änderung</th>';
        html += '<th>Bearbeiten/Löschen</th>';
        timeentries.forEach(function(entry) {
            html += '<tr>';
            html += '<td>' + moment(entry.entry_date).format('HH:mm') + '</td>';
            html += '<td>' + entry.direction + '</td>';
            html += '<td>' + entry.isWorkingDay + '</td>';
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