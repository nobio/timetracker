$.ajaxSetup({
    cache : false
});

var busyChartVariable;

function timeentry(direction, datetime) {
    // setup the date & time
    var dt;
    if (datetime === 'self') {
        dt = moment();
        dt.millisecond(0);
        dt.second(0);
        dt = dt.toISOString();
    } else {
        dt = moment(datetime, 'DD.MM.YYYY HH:mm').toISOString();
    }

    var entry = new TimeEntry(); // TimeEntry is a Backbone Model defined in layout.jade
    entry.save({'direction': direction, 'datetime': dt}, {
        wait:true,
        success:function(model, timeentry) {
            console.log('Successfully saved!');
            var sDate = moment(timeentry.entry_date).format('DD.MM.YYYY');
            var sTime = moment(timeentry.entry_date).format('HH:mm');

            result.innerHTML = timeentry.direction;
            result.innerHTML += " am ";
            result.innerHTML += sDate;
            result.innerHTML += " um ";
            result.innerHTML += sTime;
            size.innerHTML = timeentry.size;
        },
        error: function(model, err) {
            result.innerHTML = "Error (" + err.status + "): " + err.responseText;
        }
    });

}

function maintainHoliday(date, holiday) {
    var isHoliday = (holiday === 'on');

    $.ajax({
        type : 'PUT',
        url : '/admin/holiday',
        dataType : 'json',
        data : {
            'holiday' : isHoliday,
            'date' : date
        }
    }).done(function(response) {
        result.innerHTML = 'holiday set/reset successfully: ' + response._id;
    }, 'json').error(function(err) {
        result.innerHTML = "Error (" + err.status + "): " + err.responseText;
    });
}

function deleteAllTimeEntries() {
    $.ajax({
        type : 'DELETE',
        url : '/entry',
        dataType : 'json'
    }).done(function(response) {
        result.innerHTML = 'deleted ' + response.size + ' time entries';
    })
    //    .success(function(response) { alert("success: " + response.count); })
    .error(function(err) {
        alert("error: " + err.status + " (" + err + ")");
    });
    //    .fail(function(err) { alert("failed: " + err.status + " (" + err.statusText + ")"); })
    //    .always(function() { alert("always"); })
}

function calculateStats() {
    $.ajax({
        type : 'PUT',
        url : '/stats',
        dataType : 'json'
    }).done(function(response) {
        result.innerHTML = 'updated statistics: ' + response;
    }).error(function(err) {
        alert("error: " + err.status + " (" + err + ")");
    });
}

function getTimeEntriesByDate(dt) {

    result.innerHTML = '';
    getBusyTime(dt, function(err, duration) {
        
        if (err) {
            result.innerHTML = "Error (" + err.status + "): " + err.responseText;
        }

        $.ajax({
            type : 'GET',
            url : '/entries/dt/' + dt,
            dataType : 'json',
        }).done(function(timeentries) {
            var html = 'Anwesenheit: ';
            if (duration) {
                html += moment(duration - 60 * 60 * 1000).format('HH:mm:ss') + ' Stunden';
            }
            html += '<table><th>Datum</th>';
            html += '<th>Zeit</th>';
            html += '<th>Kommen/Gehen</th>';
            html += '<th>Letzte Änderung</th>';
            html += '<th>Bearbeiten/Löschen</th>';
            timeentries.forEach(function(entry) {
                html += '<tr>';
                html += '<td>' + moment(entry.entry_date).format('DD.MM.YYYY') + '</td>';
                html += '<td>' + moment(entry.entry_date).format('HH:mm') + '</td>';
                html += '<td>' + entry.direction + '</td>';
                html += '<td>' + moment(entry.last_changed).format('DD.MM.YYYYY HH:mm:ss') + '</td>';
                html += '<td>';
                html += '<input type="button" value="bearbeiten" onclick="window.location=\'/admin_item?id=' + entry._id + '\';">';
                html += '<input type="button" value="löschen" onclick="deleteTimeEntryById(\'' + entry._id + '\');">';
                html += '</td>';
                html += '</tr>';
            });
            html += '</table>';
            data_by_date.innerHTML = html;

        }, 'json').error(function(err) {
            result.innerHTML = "Error (" + err.status + "): " + err.responseText;
        });

    });

}

function getBusyTime(dt, callback) {

    $.ajax({
        type : 'GET',
        url : '/entries/busy/' + dt,
        dataType : 'json',
    }).done(function(duration) {
        callback(null, duration);
    }, 'json').error(function(err) {
        callback(err);
    });

}

function storeTimeEntryById(id, entry_date, direction) {

    alert(id + ", " + entry_date + ", " + direction);

    $.ajax({
        type : 'PUT',
        url : '/entry/' + id,
        dataType : 'json',
        data : {
            'direction' : direction,
            'datetime' : dt
        }
    }).done(function(response) {
        result.innerHTML = 'stored Time Entry ' + response;
    }).error(function(err) {
        result.innerHTML = "Error (" + err.status + "): " + err.responseText;
    });
};

function deleteTimeEntryById(id) {

    $.ajax({
        type : 'DELETE',
        url : '/entry/' + id,
        dataType : 'json',
    }).done(function(response) {
        result.innerHTML = 'deleted Time Entry ' + response;
    }).error(function(err) {
        result.innerHTML = "Error (" + err.status + "): " + err.responseText;
    });
};

function nextStatsDay(tableref, time, timeUnit, direction) {
    var date;
    var nextDate;

    if (timeUnit === 'year') {
        date = moment(time.val(), 'YYYY');
        nextDate = date.add('years', direction);
        time.val(nextDate.format('YYYY'));
        // setting nextDate as value of text field
    } else if (timeUnit === 'month') {
        date = moment(time.val(), 'MMMM YYYY');
        nextDate = date.add('months', direction);
        time.val(nextDate.format('MMMM YYYY'));
        // setting nextDate as value of text field
    } else if (timeUnit === 'week') {
        date = moment(time.val(), 'W');
        nextDate = date.add('weeks', direction);
        time.val(nextDate.format('W'));
        // setting nextDate as value of text field
    } else if (timeUnit === 'day') {
        date = moment(time.val(), 'ddd DD.MM.YYYY');
        nextDate = date.add('days', direction);
        time.val(nextDate.format('ddd DD.MM.YYYY'));
        // setting nextDate as value of text field
    }

    $.ajax({
        type : 'GET',
        url : '/stats/' + nextDate,
        data : {
            'timeUnit' : timeUnit
        },
        dataType : 'json',
    }).done(function(timerecord) {

        plannedTime.innerHTML = Math.round(timerecord.planned_working_time / 1000 / 60 / 60 * 100) / 100;
        actualTime.innerHTML = Math.round(timerecord.actual_working_time / 1000 / 60 / 60 * 100) / 100;
        averageTime.innerHTML = Math.round(timerecord.average_working_time * 100) / 100;
        diffTime.innerHTML = Math.round((timerecord.actual_working_time - timerecord.planned_working_time) / 1000 / 60 / 60 * 100) / 100;
        
        busyChartVariable.setData(timerecord.chart_data);
    }, 'json').error(function(err) {
        result.innerHTML = "Error (" + err.status + "): " + err.responseText;
    });

    return null;
}

function book() {
}
