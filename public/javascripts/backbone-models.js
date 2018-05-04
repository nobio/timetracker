// defining Backbone models
TimeEntry = Backbone.Model.extend({
    urlRoot: '/api/entries',
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
    url: '/api/entries'
});

Statistics = Backbone.Model.extend({
    urlRoot: '/api/stats',
});

StatisticsAggregated = Backbone.Model.extend({
    urlRoot: '/api/statistics/aggregate',
});

Duration = Backbone.Model.extend({
    urlRoot: '/api/entries'
});

