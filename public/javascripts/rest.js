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

    var entry = new TimeEntry(); // TimeEntry is a Backbone Model defined in layout.pug
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

/*
function deleteAllTimeEntries() {
    $.ajax({
        type : 'DELETE',
        url : '/entries',
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
*/
function calculateStats() {
    var stats = new Statistics({id:''}); // model needs attribute "id" so "isNew === false"; this leads to call PUT rather than POST
    stats.save({}, {
        wait:true,
        success:function(model, response) {
            result.innerHTML = 'updated statistics: ' + JSON.stringify(response);
            alert('updated statistics: ' + JSON.stringify(response))
        },
        error: function(model, err) {
            alert("Error (" + err.status + "): " + err.responseText);
        }
    });
}

function backupData() {
    $.ajax({
        type : 'POST',
        url : '/api/entries/backup',
        dataType : 'json'
    }).done(function(response) {
        result.innerHTML = 'data backuped ' + response.backup_count + ' time entries';
        alert('data backuped ' + response.backup_count + ' time entries');
    })
    .error(function(err) {
        alert("error: " + err.status + " (" + err + ")");
    });
}

function dumpData() {
    $.ajax({
        type : 'POST',
        url : '/api/entries/dump',
        dataType : 'json'
    }).done(function(response) {
        result.innerHTML = 'data dumped ' + response.size + ' time entries to ' + response.filename;
        alert('data dumped ' + response.size + ' time entries to ' + response.filename);
    })
    .error(function(err) {
        alert("error: " + err.status + " (" + err + ")");
    });
}

function getTimeEntriesByDate(dt) {

    result.innerHTML = '';
    getBusyTime(dt, function(err, busy) {

        if (err) {
            result.innerHTML = "Error (" + err.status + "): " + err.responseText;
        }
        
        var entries = new TimeEntries(); // TimeEntry is a Backbone Model defined in layout.pug
        entries.fetch({
            data: { dt: ""+dt }, 
            success: function(timeentries) {
                var html = 'Anwesenheit: ';
                if (busy && !busy.isEmpty({})) {
                    let duration = moment(busy.attributes.duration - 60 * 60 * 1000).format('HH:mm');
                    let busytime = moment(busy.attributes.busytime - 60 * 60 * 1000).format('HH:mm');
                    let pausetime = moment(busy.attributes.pause - 60 * 60 * 1000).format('HH:mm');
                    html += 'Anwesenheit: ' + duration + ', Arbeit: ' + busytime + ', Pausen: ' + pausetime;
                } else {
                    html += 'Ruhetag'
                }
                html += '<table><th>Datum</th>';
                html += '<th>Zeit</th>';
                html += '<th>Kommen/Gehen</th>';
                html += '<th>Letzte Änderung</th>';
                html += '<th>Bearbeiten/Löschen</th>';
                timeentries.forEach(function(entry) {
                    html += '<tr>';
                    html += '<td>' + moment(entry.get("entry_date")).format('DD.MM.YYYY') + '</td>';
                    html += '<td>' + moment(entry.get("entry_date")).format('HH:mm') + '</td>';
                    html += '<td>' + entry.get("direction") + '</td>';
                    html += '<td>' + moment(entry.get("last_changed")).format('DD.MM.YYYYY HH:mm:ss') + '</td>';
                    html += '<td>';
                    html += '<input type="button" value="bearbeiten" onclick="window.location=\'/admin_item?id=' + entry.get("_id") + '\';">';
                    html += '<input type="button" value="löschen" onclick="deleteTimeEntryById(\'' + entry.get("_id") + '\');">';
                    html += '</td>';
                    html += '</tr>';
                });
                html += '</table>';
                data_by_date.innerHTML = html;
            },
            error: function(model, err) {
                result.innerHTML = "Error (" + err.status + "): " + err.responseText;
            }
        });
    });

}

function getBusyTime(dt, callback) {
    
    var duration = new Duration();
    duration.fetch({
        data: {busy: ""+dt},
        success: function(busy) {
            callback(null, busy);
        },
        error: function(model, err) {
            callback(err);
        }
    });
    
}

function deleteTimeEntryById(id) {
    var entry = new TimeEntry({'id': id}); // TimeEntry is a Backbone Model defined in layout.pug
    entry.destroy({
        wait:true,
        success:function(model, response) {
            result.innerHTML = 'deleted Time Entry ' + response;
        },
        error: function(model, err) {
            result.innerHTML = "Error (" + err.status + "): " + err.responseText;
        }
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

    var stats = new Statistics({'id': ""+nextDate}); // Statistics is a Backbone Model defined in layout.pug
    stats.fetch({ 
        data: {timeUnit: timeUnit},
        success:function(timerecord) {
            plannedTime.innerHTML = Math.round(timerecord.get("planned_working_time") / 1000 / 60 / 60 * 100) / 100;
            actualTime.innerHTML = Math.round(timerecord.get("actual_working_time") / 1000 / 60 / 60 * 100) / 100;
            averageTime.innerHTML = Math.round(timerecord.get("average_working_time") * 100) / 100;
            diffTime.innerHTML = Math.round((timerecord.get("actual_working_time") - timerecord.get("planned_working_time")) / 1000 / 60 / 60 * 100) / 100;
            
            busyChartVariable.setData(timerecord.get("chart_data"));
        },
        error: function(model, err) {
            console.log(model);
            console.log(err);
        }
    });

    return null;
}

function aggregatedStatistics(timeUnit) {
    var aggStats = new StatisticsAggregated();
    aggStats.fetch({
        data: {timeUnit: timeUnit},
        success:function(statistic_data) {
            aggStatsVariable.setData(statistic_data.get("chart_data"));
        },
        error: function(model, err) {
            console.log(model);
            console.log(err);
        }
    });
}