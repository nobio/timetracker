$.ajaxSetup ({
             cache: false
             });

function enterNow() {
    $.ajax({
           type: 'POST',
           url: '/entry',
           data: { 'direction': 'enter' }
           }).done(function(timeentry) {
                   result.innerHTML = timeentry.entry_date;
                   });
}

function goNow() {
    $.ajax({
           type: 'POST',
           url: '/entry',
           data: { 'direction': 'go' }
           }).done(function(timeentry) {
                   result.innerHTML = timeentry.entry_date;
                   }, 'json');
}

function deleteAllTimeEntries() {
    $.ajax({
           type: 'DELETE',
           url: '/entry'
           })
    .done(function(response) {
          result.innerHTML = 'deleted ' + response.size + ' time entries';
          })
//    .success(function(response) { alert("success: " + response.count); })
    .error(function(err) { alert("error: " + err.status + " (" + err.statusText + ")"); })
//    .fail(function(err) { alert("failed: " + err.status + " (" + err.statusText + ")"); })
//    .always(function() { alert("always"); })
}

/*
function getById(id, div) {
    $.get("/load/" + id,
          function(todo, status) {
          div.innerHTML = todo.content + ", " + todo.color + ", " + todo._id;
          })
    .error(function(err) { alert("error: " + err.status + " (" + err.statusText + ")"); })
    .fail(function(err) { alert("failed: " + err.status + " (" + err.statusText + ")"); })
}

function putById(id, color, div) {
    $.ajax({
           type: "PUT",
           url: "/save/" + id,
           data: { "color": color }
           }).done(function(todo) {
                   div.innerHTML = todo.content + ", " + todo.color + ", " + todo._id;
                   });
}

function postTodo(name, color, div) {
    $.post("/post", { "content": name, "color": color },
           function(todo){
           div.innerHTML = todo.content + ", " + todo.color + ", " + todo._id;
           },
           "json")
    .error(function(err) { alert("error: " + err.status + " (" + err.statusText + ")"); })
    .fail(function(err) { alert("failed: " + err.status + " (" + err.statusText + ")"); })
}

function deleteById(id, div) {
    $.ajax({
           type: "DELETE",
           url: "/delete/" + id,
           }).done(function(todo) {
                   div.innerHTML = id;
                   });
}

function getAll(div) {
    $.get("/load",
          function(todos, status) {
          div.innerHTML = todos;
          })
    .error(function(err) { alert("error: " + err.status + " (" + err.statusText + ")"); })
    .fail(function(err) { alert("failed: " + err.status + " (" + err.statusText + ")"); })
}
*/
