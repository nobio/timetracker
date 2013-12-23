
var mongoose = require('mongoose');
var TimeEntry  = mongoose.model('TimeEntry');

/* ================================================================== */
/* =========================== JADE/HTML ============================ */
/* ================================================================== */
exports.index = function(req, res) {
    var size;
    TimeEntry.find(function(err, timeentries) {
                   size = timeentries.length;
                   res.render('index', {
                              size: size
                              });
                   
                   })
};
                   
                   
exports.admin = function(req, res) {
    res.render('admin');
}

/* ================================================================== */
/* ============================== REST ============================== */
/* ================================================================== */

exports.entry = function(req, res) {
    console.log('entry function');
    var direction = req.body.direction;
    
    new TimeEntry({
                  entry_date: new Date,
                  direction: direction
                  }).save(function(err, timeentry) {
                          console.log(timeentry);
                          
                          if(!err) {
                            res.send(timeentry);
                          } else {
                            res.send('error while saving data: ' + err.message + ' [' + err + ']');
                          }
                          });
}

exports.deleteAll = function(req, res) {
    var size;
    TimeEntry.find(function(err, timeentries) {
                   size = timeentries.length;
                   timeentries.forEach(function(timeentry) {
                                       console.log(timeentry);
                                       timeentry.remove();
                   
                   });
                   console.log('deleted ' + size + ' items');
                   res.send({ size: size });
                   });
}
                   
/*
exports.person_post = function(req, res) {
    console.log("-------------- ADD PERSON --------------");
    console.log(req.params.id);
    console.log(req.body.name);
    console.log(req.body);
    new Person({
               name: req.body.name,
               cs_number   : req.body.cs_number,
               mail_address: req.body.mail_address,
               phone_number: req.body.phone_number
               }).save(function(err, p) {
                       res.send(p);
                       });

}

exports.person_get = function(req, res) {
    console.log("-------------- GET PERSON --------------");
    console.log(req.params.id);
    
 	Person.findById(req.params.id, function(err, person) {
                    console.log("error: " + err);
                    console.log("found person: " + person);
                    if(!err && person) {
                    res.send(person);
                    } else {
                    res.send(null);
                    }
                    });
}

exports.person_get_all = function(req, res) {
    console.log("-------------- GET ALL PERSONs --------------");
    Person.find(null, null, null, function(err, docs) {
                res.send(docs);
                });
}

exports.person_put = function(req, res) {
    console.log("-------------- PUT PERSON --------------");
    console.log(req.params.id);
    console.log(req.body.name);
    console.log(req.body);
//    Person.findByIdAndUpdate(req.param.id, {name:"Gernot"});
//    res.send(null);

 	Person.findById(req.params.id, function(err, person) {
                    
                    console.log("error: " + err);
                    console.log("person: " + person);

                    if(!err && person) {
                    person.name = req.body.name;
                    person.cs_number = req.body.cs_number;
                    person.mail_address = req.body.mail_address;
                    person.phone_number = req.body.phone_number;

                    person.save(function(err, p, count) {
                                res.send(p);
                                });
                    } else {
                    res.send(null);
                    }
                    });

}

exports.person_delete = function(req, res) {
    console.log("-------------- DELETE PERSON --------------");
    console.log(req.params.id);

 	Person.findById(req.params.id, function(err, person) {
 		console.log("error: " + err);
 		console.log("found person: " + person);
 		if(!err && person) {
 			person.remove(function(err, p) {
		 		console.log("error: " + err);
		 		console.log("person: " + p);
 				res.send(person);
 			});
 		} else {
 			res.send(null); 			
 		}
 	});
}

exports.index = function(req, res){
    console.log("-------------- INDEX --------------");
    console.log(req.headers);
    res.render('index');
    Carpark
    .find()
    .exec(function (err, carparks) {
          if(err) {
          carparks = [];
          }
          
          Person
          .find()
          .exec(function (err, persons) {
                if(err) {
                persons = [];
                }
                
                res.render('index', {
                           title : 'Car Park',
                           nb_carparks : carparks.length,
                           nb_persons : persons.length
                           });
                });
          });
};


exports.list_carpark = function(req, res) {
    console.log("-------------- LIST ALL CARPARKS --------------");
    Carpark
    .find()
    .sort('number')
    .exec(function (err, carparks) {
          if(err) {
          carparks = [];
          }
          res.render('list_carpark', {
                     title : 'All Car Park',
                     carparks : carparks
                     });
          });
    
}

exports.list_person = function(req, res) {
    console.log("-------------- LIST ALL PERSONS --------------");
    Person
    .find()
    .sort('cs_number')
    .exec(function (err, persons) {
          if(err) {
          persons = [];
          }
          res.render('list_person', {
                     title : 'All Persons',
                     persons : persons
                     });
          });
    
}



exports.input_create_carpark = function(req, res) {
    console.log("-------------- INPUT CREATE CAR PARK --------------");
    res.render('input_create_carpark', {
               title: 'New Car park'
               });
};

exports.create_carpark = function(req, res) {
    console.log("-------------- CREATE CAR PARK --------------");
    
    new Person({
               name             : req.body.owner_name,
               cs_number        : req.body.owner_cs_number,
               mail_address     : req.body.owner_mail_address,
               phone_number     : req.body.owner_phone_number
               }).save(function(err, person){
                       if(err) {
                       throw err;
                       }
                       new Carpark({
                                   number       : req.body.number,
                                   owner        : person,
                                   unused_from  : parseDate(req.body.unused_from),
                                   unused_until : parseDate(req.body.unused_until)
                                   }).save(function(err, carpark, count){
                                           if(err) {
                                           throw err;
                                           }
                                           res.redirect( '/' );
                                           });
                       });
};

exports.delete_carpark = function(req, res) {
    console.log("-------------- DELETE CAR PARK --------------");
    
    Carpark.findById(req.params.id, function(err, carpark) {
                     if(!err && carpark) {
                     carpark.remove(function(err, carpark, count) {
                                    res.send(carpark);
                                    });
                     }
                     });
}

exports.input_create_person = function(req, res) {
    console.log("-------------- INPUT CREATE PERSON --------------");
    res.render('input_create_person', {
               title: 'New Person'
               });
};

exports.create_person = function(req, res) {
    console.log("-------------- CREATE PERSON --------------");
    
    new Person({
               name             : req.body.name,
               cs_number        : req.body.cs_number,
               mail_address     : req.body.mail_address,
               phone_number     : req.body.phone_number
               }).save(function(err, person){
                       if(err) {
                       throw err;
                       }
                       res.redirect( '/' );
                       });
};

exports.delete_person = function(req, res) {
    console.log("-------------- DELETE PERSON --------------");
    rest.person_delete(req, res);
}

// parses a string in format 'dd.mm.yyyy' to a date type
function parseDate(dt) {
    return new Date(dt.replace(/(\d{2}).(\d{2}).(\d{4})/, "$2/$1/$3"));
}
*/
