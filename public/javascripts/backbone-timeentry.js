// defining Backbone models
TimeEntry = Backbone.Model.extend({
    urlRoot: '/entry',
    defaults: {
        direction: '',
        entry_date: new Date(),
        last_changed: new Date()
    },
    initialize: function() {
        //alert(this.model);
    }
});

EntryList = Backbone.Collection.extend({
    model: TimeEntry,
    url: '/entry'
});

Statistics = Backbone.Model.extend({
    urlRoot: '/stats',
});

