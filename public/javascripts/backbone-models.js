// defining Backbone models
TimeEntry = Backbone.Model.extend({
    urlRoot: '/entries',
    defaults: {
        direction: '',
        entry_date: new Date(),
        last_changed: new Date()
    },
    initialize: function() {
        //alert(this.model);
    }
});

TimeEntries = Backbone.Collection.extend({
    model: TimeEntry,
    url: '/entries'
});

Statistics = Backbone.Model.extend({
    urlRoot: '/stats',
});

Duration = Backbone.Model.extend({
    urlRoot: '/entries'
});

