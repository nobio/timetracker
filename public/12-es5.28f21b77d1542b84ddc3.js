function _defineProperties(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}function _createClass(e,t,n){return t&&_defineProperties(e.prototype,t),n&&_defineProperties(e,n),e}function _get(e,t,n){return(_get="undefined"!=typeof Reflect&&Reflect.get?Reflect.get:function(e,t,n){var o=_superPropBase(e,t);if(o){var r=Object.getOwnPropertyDescriptor(o,t);return r.get?r.get.call(n):r.value}})(e,t,n||e)}function _superPropBase(e,t){for(;!Object.prototype.hasOwnProperty.call(e,t)&&null!==(e=_getPrototypeOf(e)););return e}function _inherits(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&_setPrototypeOf(e,t)}function _setPrototypeOf(e,t){return(_setPrototypeOf=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function _createSuper(e){var t=_isNativeReflectConstruct();return function(){var n,o=_getPrototypeOf(e);if(t){var r=_getPrototypeOf(this).constructor;n=Reflect.construct(o,arguments,r)}else n=o.apply(this,arguments);return _possibleConstructorReturn(this,n)}}function _possibleConstructorReturn(e,t){return!t||"object"!=typeof t&&"function"!=typeof t?_assertThisInitialized(e):t}function _assertThisInitialized(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function _isNativeReflectConstruct(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}function _getPrototypeOf(e){return(_getPrototypeOf=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(window.webpackJsonp=window.webpackJsonp||[]).push([[12],{"2hxB":function(e,t,n){"use strict";n.d(t,"a",(function(){return o}));var o=function e(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"",n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"",o=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"",r=arguments.length>3&&void 0!==arguments[3]?arguments[3]:"",i=arguments.length>4&&void 0!==arguments[4]?arguments[4]:"";_classCallCheck(this,e),this.id=t,this.name=n,this.username=o,this.mailAddress=r,this.password=i}},UnmI:function(e,t,n){"use strict";n.d(t,"a",(function(){return f}));var o=n("un/a"),r=n("JIr8"),i=n("xUNR"),a=n("2hxB"),s=n("eHTu"),c=n("fXoL"),l=n("tk/3"),u=n("TEn/"),g=n("iXKo"),f=function(){var e=function(e){_inherits(n,e);var t=_createSuper(n);function n(e,o,r){var i;return _classCallCheck(this,n),(i=t.call(this,e,o,r)).httpClient=e,i.alertCtrl=o,i.logger=r,i}return _createClass(n,[{key:"calculateStatistics",value:function(){var e=this;return this.logger.log("calculate busy time"),new Promise((function(t,i){e.PUT("/api/stats").pipe(Object(o.a)(2),Object(r.a)(_get(_getPrototypeOf(n.prototype),"handleError",e))).subscribe((function(n){e.logger.log("successfully recalculated"),t("Berechnung erfolgreich durchgef\xfchrt")}),(function(t){_get(_getPrototypeOf(n.prototype),"handleError",e).call(e,t),e.logger.error("failed to recalculate "+t),i("Fehler bei Berechnung: "+t)}))}))}},{key:"dumpTimeEntries",value:function(){var e=this;return new Promise((function(t,i){e.POST("/api/entries/dump").pipe(Object(o.a)(2),Object(r.a)(_get(_getPrototypeOf(n.prototype),"handleError",e))).subscribe((function(n){e.logger.log(n),e.logger.log("successfully dumped data"),t('res["size"] Datens\xe4tze erfolgreich als Datei gesichert ('.concat(n.filename,")"))}),(function(t){_get(_getPrototypeOf(n.prototype),"handleError",e).call(e,t),e.logger.error("failed to save file "+t),i("Fehler bei der Sicherung der Daten: "+t)}))}))}},{key:"backupTimeEntries",value:function(){var e=this;return this.logger.log("backup data"),new Promise((function(t,i){e.POST("/api/entries/backup").pipe(Object(o.a)(2),Object(r.a)(_get(_getPrototypeOf(n.prototype),"handleError",e))).subscribe((function(n){e.logger.log(JSON.stringify(n)),e.logger.log("successfully backed up data to MongoDB"),t(n.size+" Datens\xe4tze erfolgreich als MongoDB gesichert")}),(function(t){_get(_getPrototypeOf(n.prototype),"handleError",e).call(e,t),e.logger.error("failed to backup data to MongoDB "+t),i("Fehler bei der Sicherung der Daten in MongoDB: "+t)}))}))}},{key:"loadToggles",value:function(){var e=this;return new Promise((function(t,a){e.GET("/api/toggles/").pipe(Object(o.a)(2),Object(r.a)(_get(_getPrototypeOf(n.prototype),"handleError",e))).subscribe((function(n){e.logger.log("loaded toggles: "+JSON.stringify(n));var o=new i.a;n.forEach((function(e){o.setToggle(e)})),t(o)}),(function(t){e.logger.error("failed to load toggles "+t),a("Toggles konnten nicht geladen werden: "+t)}))}))}},{key:"saveToggle",value:function(e){var t=this;return new Promise((function(i,a){t.PUT("/api/toggles/"+e.id,e,{},!1).pipe(Object(o.a)(2),Object(r.a)(_get(_getPrototypeOf(n.prototype),"handleError",t))).subscribe((function(t){i("Toggle "+e.name+" has successfully been saved")}),(function(e){t.logger.error("failed to save toggle "+e),a("Error while saving toggle "+e)}))}))}},{key:"evaluateTimeEntries",value:function(){var e=this;return this.logger.log("evaluate data"),new Promise((function(t,i){e.POST("/api/entries/error/evaluate").pipe(Object(o.a)(2),Object(r.a)(_get(_getPrototypeOf(n.prototype),"handleError",e))).subscribe((function(n){e.logger.log(n),e.logger.log("successfully initiated evaluation of time entries"),t(n.message)}),(function(t){_get(_getPrototypeOf(n.prototype),"handleError",e).call(e,t),e.logger.error("failed to save toggle "+t),i("Error while saving toggle "+t)}))}))}},{key:"loadAllUser",value:function(){var e=this;this.logger.log("loading Users");var t=new Array;return new Promise((function(i,s){e.GET("/api/users").pipe(Object(o.a)(2),Object(r.a)(_get(_getPrototypeOf(n.prototype),"handleError",e))).subscribe((function(e){e.forEach((function(e){t.push(new a.a(e.id,e.name,e.username,e.mailAddress,e.password))})),i(t)}),(function(t){_get(_getPrototypeOf(n.prototype),"handleError",e).call(e,t),e.logger.error("failed to load all users "+t),s("Error loading users "+t)}))}))}},{key:"loadUser",value:function(e){var t=this;return new Promise((function(i,s){t.GET("/api/users/"+e).pipe(Object(o.a)(2),Object(r.a)(_get(_getPrototypeOf(n.prototype),"handleError",t))).subscribe((function(e){return i(new a.a(e.id,e.name,e.username,e.mailAddress,e.password))}),(function(o){_get(_getPrototypeOf(n.prototype),"handleError",t).call(t,o),t.logger.error("failed to load user ".concat(e,": ").concat(o)),s("Error loading user "+e+" "+o)}))}))}},{key:"updateUser",value:function(e){var t=this;return new Promise((function(o,r){t.PUT("/api/users/"+e.id,{name:e.name,mailAddress:e.mailAddress}).subscribe((function(e){return o()}),(function(o){_get(_getPrototypeOf(n.prototype),"handleError",t).call(t,o),t.logger.error("failed to update user ".concat(e,": ").concat(o)),r("Error updating user "+e.name+" "+o)}))}))}},{key:"setPassword",value:function(e){var t=this;return new Promise((function(o,r){t.PUT("/api/users/".concat(e.id,"/password"),{password:e.password}).subscribe((function(e){return o()}),(function(o){_get(_getPrototypeOf(n.prototype),"handleError",t).call(t,o),t.logger.error("failed to set password of user ".concat(e,": ").concat(o)),r("Error updating user "+e.name+" "+o)}))}))}},{key:"deleteUser",value:function(e){var t=this;return new Promise((function(o,r){t.DELETE("/api/users/"+e.id).subscribe((function(e){return o()}),(function(o){_get(_getPrototypeOf(n.prototype),"handleError",t).call(t,o),t.logger.error("failed to delete user ".concat(e,": ").concat(o)),r("Error deleting user "+e.name+" "+o)}))}))}}]),n}(s.a);return e.\u0275fac=function(t){return new(t||e)(c.Qb(l.b),c.Qb(u.b),c.Qb(g.a))},e.\u0275prov=c.Fb({token:e,factory:e.\u0275fac,providedIn:"root"}),e}()},"p/Jj":function(e,t,n){"use strict";n.r(t),n.d(t,"AdminPageModule",(function(){return M}));var o,r,i,a=n("TEn/"),s=n("tyNb"),c=n("ofXK"),l=n("3Pt+"),u=n("mrSG"),g=n("xUNR"),f=n("fXoL"),b=n("UnmI"),p=n("YjT7"),h=n("iXKo"),d=n("HmWd"),m=function(){return["./user"]},y=((o=function(){function e(t,n,o,r){_classCallCheck(this,e),this.adminSrv=t,this.toastCtrl=n,this.props=o,this.logger=r,this.toggles=new g.a,this.toggleSlackNotificationEnabled=!1}return _createClass(e,[{key:"ionViewWillEnter",value:function(){var e=this;this.adminSrv.loadToggles().then((function(t){return e.toggles=t})).catch((function(t){return e.presentMessage(t,2e3)}))}},{key:"fill",get:function(){return"true"==this.props.get("de.nobio.timetracker.FILL")},set:function(e){this.props.set("de.nobio.timetracker.FILL",""+e)}},{key:"calculateBusyTime",value:function(){var e=this;this.presentMessage("Neuberechnung starten...",2e3),this.adminSrv.calculateStatistics().then((function(t){e.presentMessage(t,3e3)})).catch((function(t){e.presentMessage(t,3e3)}))}},{key:"dumpData",value:function(){var e=this;this.presentMessage("Daten ins File System dumpen...",2e3),this.adminSrv.dumpTimeEntries().then((function(t){e.presentMessage(t,3e3)})).catch((function(t){e.presentMessage(t,3e3)}))}},{key:"backupData",value:function(){var e=this;this.presentMessage("Daten in Datenbank sichern...",2e3),this.adminSrv.backupTimeEntries().then((function(t){e.presentMessage(t,3e3)})).catch((function(t){e.presentMessage(t,3e3)}))}},{key:"evaluateData",value:function(){var e=this;this.presentMessage("Daten werden untersucht...",2e3),this.adminSrv.evaluateTimeEntries().then((function(t){e.presentMessage(t,3e3)})).catch((function(t){e.presentMessage(t,3e3)}))}},{key:"saveToggle",value:function(e){var t=this,n=this.toggles.getToggle(e);this.adminSrv.saveToggle(n).catch((function(e){return t.presentMessage(e,2e3)}))}},{key:"presentMessage",value:function(e,t){return Object(u.a)(this,void 0,void 0,regeneratorRuntime.mark((function n(){return regeneratorRuntime.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:return n.next=2,this.toastCtrl.create({message:e,duration:t});case 2:n.sent.present();case 3:case"end":return n.stop()}}),n,this)})))}}]),e}()).\u0275fac=function(e){return new(e||o)(f.Jb(b.a),f.Jb(a.T),f.Jb(p.a),f.Jb(h.a))},o.\u0275cmp=f.Db({type:o,selectors:[["app-admin"]],decls:67,vars:12,consts:[[3,"translucent"],["displaySize","small"],[3,"fullscreen"],["collapse","condense"],["size","large"],["size","12","size-sm","8","offset-sm","2"],[3,"ngModel","ngModelChange","ionChange"],["size","1","size-sm","1","offset-sm","1"],["color","primary",1,"button",3,"click"],["name","pulse"],["ion-button","","color","medium",1,"button",3,"click"],["name","search"],["ion-button","","color","success",1,"button",3,"click"],["name","download"],["ion-button","","color","danger",1,"button",3,"click"],["name","logo-buffer"],["ion-button","","color","warning",1,"button",3,"routerLink"],["name","people-circle-outline"]],template:function(e,t){1&e&&(f.Mb(0,"ion-header",0),f.Mb(1,"ion-toolbar"),f.Mb(2,"ion-title"),f.mc(3," Administration "),f.Lb(),f.Lb(),f.Kb(4,"online-status-component",1),f.Lb(),f.Mb(5,"ion-content",2),f.Mb(6,"ion-header",3),f.Mb(7,"ion-toolbar"),f.Mb(8,"ion-title",4),f.mc(9,"Administration"),f.Lb(),f.Lb(),f.Lb(),f.Mb(10,"ion-grid"),f.Mb(11,"ion-row"),f.Mb(12,"ion-col",5),f.Mb(13,"ion-list"),f.Mb(14,"ion-item"),f.Mb(15,"ion-label"),f.mc(16,"Neuer Eintrag"),f.Lb(),f.Mb(17,"ion-toggle",6),f.Ub("ngModelChange",(function(e){return t.toggles.createEntry.toggle=e}))("ionChange",(function(){return t.saveToggle("CREATE_ENTRY")})),f.Lb(),f.Lb(),f.Mb(18,"ion-item"),f.Mb(19,"ion-label"),f.mc(20,"Eintrag gel\xf6scht"),f.Lb(),f.Mb(21,"ion-toggle",6),f.Ub("ngModelChange",(function(e){return t.toggles.deleteEntry.toggle=e}))("ionChange",(function(){return t.saveToggle("DELETE_ENTRY")})),f.Lb(),f.Lb(),f.Mb(22,"ion-item"),f.Mb(23,"ion-label"),f.mc(24,"Statistiken berechnet"),f.Lb(),f.Mb(25,"ion-toggle",6),f.Ub("ngModelChange",(function(e){return t.toggles.recalculate.toggle=e}))("ionChange",(function(){return t.saveToggle("RECALCULATE")})),f.Lb(),f.Lb(),f.Mb(26,"ion-item"),f.Mb(27,"ion-label"),f.mc(28,"Daten gesichert"),f.Lb(),f.Mb(29,"ion-toggle",6),f.Ub("ngModelChange",(function(e){return t.toggles.backupDB.toggle=e}))("ionChange",(function(){return t.saveToggle("BACKUP_DB")})),f.Lb(),f.Lb(),f.Mb(30,"ion-item"),f.Mb(31,"ion-label"),f.mc(32,"Daten auf Platte gesichert"),f.Lb(),f.Mb(33,"ion-toggle",6),f.Ub("ngModelChange",(function(e){return t.toggles.dumpFS.toggle=e}))("ionChange",(function(){return t.saveToggle("DUMP_FS")})),f.Lb(),f.Lb(),f.Mb(34,"ion-item"),f.Mb(35,"ion-label"),f.mc(36,"Server Start"),f.Lb(),f.Mb(37,"ion-toggle",6),f.Ub("ngModelChange",(function(e){return t.toggles.serverStartUp.toggle=e}))("ionChange",(function(){return t.saveToggle("SERVER_STARTED")})),f.Lb(),f.Lb(),f.Mb(38,"ion-item"),f.Mb(39,"ion-label"),f.mc(40,"Daten untersucht"),f.Lb(),f.Mb(41,"ion-toggle",6),f.Ub("ngModelChange",(function(e){return t.toggles.evaluateData.toggle=e}))("ionChange",(function(){return t.saveToggle("EVALUATE_DATA")})),f.Lb(),f.Lb(),f.Mb(42,"ion-item"),f.Mb(43,"ion-label"),f.mc(44,"Datenladen ohne L\xfccken"),f.Lb(),f.Mb(45,"ion-toggle",6),f.Ub("ngModelChange",(function(e){return t.fill=e}))("ionChange",(function(){return t.fill})),f.Lb(),f.Lb(),f.Lb(),f.Lb(),f.Lb(),f.Mb(46,"ion-row"),f.Mb(47,"ion-col",7),f.Mb(48,"ion-button",8),f.Ub("click",(function(){return t.calculateBusyTime()})),f.Kb(49,"ion-icon",9),f.mc(50,"\xa0 "),f.Lb(),f.Lb(),f.Mb(51,"ion-col",7),f.Mb(52,"ion-button",10),f.Ub("click",(function(){return t.evaluateData()})),f.Kb(53,"ion-icon",11),f.mc(54,"\xa0 "),f.Lb(),f.Lb(),f.Mb(55,"ion-col",7),f.Mb(56,"ion-button",12),f.Ub("click",(function(){return t.dumpData()})),f.Kb(57,"ion-icon",13),f.mc(58,"\xa0 "),f.Lb(),f.Lb(),f.Mb(59,"ion-col",7),f.Mb(60,"ion-button",14),f.Ub("click",(function(){return t.backupData()})),f.Kb(61,"ion-icon",15),f.mc(62,"\xa0 "),f.Lb(),f.Lb(),f.Mb(63,"ion-col",7),f.Mb(64,"ion-button",16),f.Kb(65,"ion-icon",17),f.mc(66,"\xa0 "),f.Lb(),f.Lb(),f.Lb(),f.Lb(),f.Lb()),2&e&&(f.bc("translucent",!0),f.zb(5),f.bc("fullscreen",!0),f.zb(12),f.bc("ngModel",t.toggles.createEntry.toggle),f.zb(4),f.bc("ngModel",t.toggles.deleteEntry.toggle),f.zb(4),f.bc("ngModel",t.toggles.recalculate.toggle),f.zb(4),f.bc("ngModel",t.toggles.backupDB.toggle),f.zb(4),f.bc("ngModel",t.toggles.dumpFS.toggle),f.zb(4),f.bc("ngModel",t.toggles.serverStartUp.toggle),f.zb(4),f.bc("ngModel",t.toggles.evaluateData.toggle),f.zb(4),f.bc("ngModel",t.fill),f.zb(19),f.bc("routerLink",f.dc(11,m)))},directives:[a.r,a.K,a.I,d.a,a.o,a.q,a.z,a.n,a.w,a.u,a.v,a.J,a.c,l.e,l.h,a.g,a.s,a.Q,s.h],styles:[""]}),o),v=[{path:"",component:y},{path:"user",loadChildren:function(){return n.e(22).then(n.bind(null,"rNAG")).then((function(e){return e.UsersPageModule}))}},{path:"user/:id",loadChildren:function(){return n.e(21).then(n.bind(null,"lE6Y")).then((function(e){return e.UserPageModule}))}}],E=((r=function e(){_classCallCheck(this,e)}).\u0275mod=f.Hb({type:r}),r.\u0275inj=f.Gb({factory:function(e){return new(e||r)},imports:[[s.i.forChild(v)],s.i]}),r),_=n("1tww"),M=((i=function e(){_classCallCheck(this,e)}).\u0275mod=f.Hb({type:i}),i.\u0275inj=f.Gb({factory:function(e){return new(e||i)},imports:[[a.L,c.b,l.b,_.a,s.i.forChild([{path:"",component:y}]),E]]}),i)},xUNR:function(e,t,n){"use strict";n.d(t,"a",(function(){return r}));var o=function(){function e(){_classCallCheck(this,e)}return _createClass(e,[{key:"setData",value:function(e,t,n,o){this.id=e,this.name=t,this.toggle=n,this.notification=o}}]),e}(),r=function(){function e(){_classCallCheck(this,e),this.createEntry=new o,this.deleteEntry=new o,this.backupDB=new o,this.dumpFS=new o,this.recalculate=new o,this.serverStartUp=new o,this.evaluateData=new o}return _createClass(e,[{key:"getToggle",value:function(e){return"CREATE_ENTRY"==e?this.createEntry:"DELETE_ENTRY"==e?this.deleteEntry:"BACKUP_DB"==e?this.backupDB:"DUMP_FS"==e?this.dumpFS:"RECALCULATE"==e?this.recalculate:"SERVER_STARTED"==e?this.serverStartUp:"EVALUATE_DATA"==e?this.evaluateData:new o}},{key:"setToggle",value:function(e){var t=new o;t.setData(e._id,e.name,e.toggle,e.notification),"CREATE_ENTRY"==e.name?this.createEntry=t:"DELETE_ENTRY"==e.name?this.deleteEntry=t:"BACKUP_DB"==e.name?this.backupDB=t:"DUMP_FS"==e.name?this.dumpFS=t:"RECALCULATE"==e.name?this.recalculate=t:"SERVER_STARTED"==e.name?this.serverStartUp=t:"EVALUATE_DATA"==e.name&&(this.evaluateData=t)}}]),e}()}}]);