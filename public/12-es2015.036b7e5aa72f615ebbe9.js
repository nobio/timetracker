(window.webpackJsonp=window.webpackJsonp||[]).push([[12],{"2hxB":function(e,t,r){"use strict";r.d(t,"a",(function(){return n}));class n{constructor(e="",t="",r="",n="",s=""){this.id=e,this.name=t,this.username=r,this.mailAddress=n,this.password=s}}},UnmI:function(e,t,r){"use strict";r.d(t,"a",(function(){return b}));var n=r("un/a"),s=r("JIr8"),o=r("xUNR"),i=r("2hxB"),a=r("eHTu"),l=r("fXoL"),g=r("tk/3"),c=r("TEn/"),u=r("iXKo");let b=(()=>{class e extends a.a{constructor(e,t,r){super(e,t,r),this.httpClient=e,this.alertCtrl=t,this.logger=r}calculateStatistics(){return this.logger.log("calculate busy time"),new Promise((e,t)=>{this.PUT("/api/stats").pipe(Object(n.a)(2),Object(s.a)(super.handleError)).subscribe(t=>{this.logger.log("successfully recalculated"),e("Berechnung erfolgreich durchgef\xfchrt")},e=>{super.handleError(e),this.logger.error("failed to recalculate "+e),t("Fehler bei Berechnung: "+e)})})}dumpTimeEntries(){return new Promise((e,t)=>{this.POST("/api/entries/dump").pipe(Object(n.a)(2),Object(s.a)(super.handleError)).subscribe(t=>{this.logger.log(t),this.logger.log("successfully dumped data"),e(`res["size"] Datens\xe4tze erfolgreich als Datei gesichert (${t.filename})`)},e=>{super.handleError(e),this.logger.error("failed to save file "+e),t("Fehler bei der Sicherung der Daten: "+e)})})}backupTimeEntries(){return this.logger.log("backup data"),new Promise((e,t)=>{this.POST("/api/entries/backup").pipe(Object(n.a)(2),Object(s.a)(super.handleError)).subscribe(t=>{this.logger.log(JSON.stringify(t)),this.logger.log("successfully backed up data to MongoDB"),e(t.size+" Datens\xe4tze erfolgreich als MongoDB gesichert")},e=>{super.handleError(e),this.logger.error("failed to backup data to MongoDB "+e),t("Fehler bei der Sicherung der Daten in MongoDB: "+e)})})}loadToggles(){return new Promise((e,t)=>{this.GET("/api/toggles/").pipe(Object(n.a)(2),Object(s.a)(super.handleError)).subscribe(t=>{this.logger.log("loaded toggles: "+JSON.stringify(t));let r=new o.a;t.forEach(e=>{r.setToggle(e)}),e(r)},e=>{this.logger.error("failed to load toggles "+e),t("Toggles konnten nicht geladen werden: "+e)})})}saveToggle(e){return new Promise((t,r)=>{this.PUT("/api/toggles/"+e.id,e,{},!1).pipe(Object(n.a)(2),Object(s.a)(super.handleError)).subscribe(r=>{t("Toggle "+e.name+" has successfully been saved")},e=>{this.logger.error("failed to save toggle "+e),r("Error while saving toggle "+e)})})}evaluateTimeEntries(){return this.logger.log("evaluate data"),new Promise((e,t)=>{this.POST("/api/entries/error/evaluate").pipe(Object(n.a)(2),Object(s.a)(super.handleError)).subscribe(t=>{this.logger.log(t),this.logger.log("successfully initiated evaluation of time entries"),e(t.message)},e=>{super.handleError(e),this.logger.error("failed to save toggle "+e),t("Error while saving toggle "+e)})})}loadAllUser(){this.logger.log("loading Users");const e=new Array;return new Promise((t,r)=>{this.GET("/api/users").pipe(Object(n.a)(2),Object(s.a)(super.handleError)).subscribe(r=>{r.forEach(t=>{e.push(new i.a(t.id,t.name,t.username,t.mailAddress,t.password))}),t(e)},e=>{super.handleError(e),this.logger.error("failed to load all users "+e),r("Error loading users "+e)})})}loadUser(e){return new Promise((t,r)=>{this.GET("/api/users/"+e).pipe(Object(n.a)(2),Object(s.a)(super.handleError)).subscribe(e=>t(new i.a(e.id,e.name,e.username,e.mailAddress,e.password)),t=>{super.handleError(t),this.logger.error(`failed to load user ${e}: ${t}`),r("Error loading user "+e+" "+t)})})}updateUser(e){return new Promise((t,r)=>{this.PUT("/api/users/"+e.id,{name:e.name,mailAddress:e.mailAddress}).subscribe(e=>t(),t=>{super.handleError(t),this.logger.error(`failed to update user ${e}: ${t}`),r("Error updating user "+e.name+" "+t)})})}setPassword(e){return new Promise((t,r)=>{this.PUT(`/api/users/${e.id}/password`,{password:e.password}).subscribe(e=>t(),t=>{super.handleError(t),this.logger.error(`failed to set password of user ${e}: ${t}`),r("Error updating user "+e.name+" "+t)})})}deleteUser(e){return new Promise((t,r)=>{this.DELETE("/api/users/"+e.id).subscribe(e=>t(),t=>{super.handleError(t),this.logger.error(`failed to delete user ${e}: ${t}`),r("Error deleting user "+e.name+" "+t)})})}}return e.\u0275fac=function(t){return new(t||e)(l.Qb(g.b),l.Qb(c.b),l.Qb(u.a))},e.\u0275prov=l.Fb({token:e,factory:e.\u0275fac,providedIn:"root"}),e})()},"p/Jj":function(e,t,r){"use strict";r.r(t),r.d(t,"AdminPageModule",(function(){return M}));var n=r("TEn/"),s=r("tyNb"),o=r("ofXK"),i=r("3Pt+"),a=r("mrSG"),l=r("xUNR"),g=r("fXoL"),c=r("UnmI"),u=r("YjT7"),b=r("iXKo"),h=r("HmWd");const d=function(){return["./user"]};let p=(()=>{class e{constructor(e,t,r,n){this.adminSrv=e,this.toastCtrl=t,this.props=r,this.logger=n,this.toggles=new l.a,this.toggleSlackNotificationEnabled=!1}ionViewWillEnter(){this.adminSrv.loadToggles().then(e=>this.toggles=e).catch(e=>this.presentMessage(e,2e3))}set fill(e){this.props.set("de.nobio.timetracker.FILL",""+e)}get fill(){return"true"==this.props.get("de.nobio.timetracker.FILL")}calculateBusyTime(){this.presentMessage("Neuberechnung starten...",2e3),this.adminSrv.calculateStatistics().then(e=>{this.presentMessage(e,3e3)}).catch(e=>{this.presentMessage(e,3e3)})}dumpData(){this.presentMessage("Daten ins File System dumpen...",2e3),this.adminSrv.dumpTimeEntries().then(e=>{this.presentMessage(e,3e3)}).catch(e=>{this.presentMessage(e,3e3)})}backupData(){this.presentMessage("Daten in Datenbank sichern...",2e3),this.adminSrv.backupTimeEntries().then(e=>{this.presentMessage(e,3e3)}).catch(e=>{this.presentMessage(e,3e3)})}evaluateData(){this.presentMessage("Daten werden untersucht...",2e3),this.adminSrv.evaluateTimeEntries().then(e=>{this.presentMessage(e,3e3)}).catch(e=>{this.presentMessage(e,3e3)})}saveToggle(e){const t=this.toggles.getToggle(e);this.adminSrv.saveToggle(t).catch(e=>this.presentMessage(e,2e3))}presentMessage(e,t){return Object(a.a)(this,void 0,void 0,(function*(){(yield this.toastCtrl.create({message:e,duration:t})).present()}))}}return e.\u0275fac=function(t){return new(t||e)(g.Jb(c.a),g.Jb(n.T),g.Jb(u.a),g.Jb(b.a))},e.\u0275cmp=g.Db({type:e,selectors:[["app-admin"]],decls:67,vars:12,consts:[[3,"translucent"],["displaySize","small"],[3,"fullscreen"],["collapse","condense"],["size","large"],["size","12","size-sm","8","offset-sm","2"],[3,"ngModel","ngModelChange","ionChange"],["size","2","size-sm","1","offset-sm","1"],["color","primary",1,"button",3,"click"],["name","pulse"],["ion-button","","color","medium",1,"button",3,"click"],["name","search"],["ion-button","","color","success",1,"button",3,"click"],["name","download"],["ion-button","","color","danger",1,"button",3,"click"],["name","logo-buffer"],["ion-button","","color","warning",1,"button",3,"routerLink"],["name","people-circle-outline"]],template:function(e,t){1&e&&(g.Mb(0,"ion-header",0),g.Mb(1,"ion-toolbar"),g.Mb(2,"ion-title"),g.mc(3," Administration "),g.Lb(),g.Lb(),g.Kb(4,"online-status-component",1),g.Lb(),g.Mb(5,"ion-content",2),g.Mb(6,"ion-header",3),g.Mb(7,"ion-toolbar"),g.Mb(8,"ion-title",4),g.mc(9,"Administration"),g.Lb(),g.Lb(),g.Lb(),g.Mb(10,"ion-grid"),g.Mb(11,"ion-row"),g.Mb(12,"ion-col",5),g.Mb(13,"ion-list"),g.Mb(14,"ion-item"),g.Mb(15,"ion-label"),g.mc(16,"Neuer Eintrag"),g.Lb(),g.Mb(17,"ion-toggle",6),g.Ub("ngModelChange",(function(e){return t.toggles.createEntry.toggle=e}))("ionChange",(function(){return t.saveToggle("CREATE_ENTRY")})),g.Lb(),g.Lb(),g.Mb(18,"ion-item"),g.Mb(19,"ion-label"),g.mc(20,"Eintrag gel\xf6scht"),g.Lb(),g.Mb(21,"ion-toggle",6),g.Ub("ngModelChange",(function(e){return t.toggles.deleteEntry.toggle=e}))("ionChange",(function(){return t.saveToggle("DELETE_ENTRY")})),g.Lb(),g.Lb(),g.Mb(22,"ion-item"),g.Mb(23,"ion-label"),g.mc(24,"Statistiken berechnet"),g.Lb(),g.Mb(25,"ion-toggle",6),g.Ub("ngModelChange",(function(e){return t.toggles.recalculate.toggle=e}))("ionChange",(function(){return t.saveToggle("RECALCULATE")})),g.Lb(),g.Lb(),g.Mb(26,"ion-item"),g.Mb(27,"ion-label"),g.mc(28,"Daten gesichert"),g.Lb(),g.Mb(29,"ion-toggle",6),g.Ub("ngModelChange",(function(e){return t.toggles.backupDB.toggle=e}))("ionChange",(function(){return t.saveToggle("BACKUP_DB")})),g.Lb(),g.Lb(),g.Mb(30,"ion-item"),g.Mb(31,"ion-label"),g.mc(32,"Daten auf Platte gesichert"),g.Lb(),g.Mb(33,"ion-toggle",6),g.Ub("ngModelChange",(function(e){return t.toggles.dumpFS.toggle=e}))("ionChange",(function(){return t.saveToggle("DUMP_FS")})),g.Lb(),g.Lb(),g.Mb(34,"ion-item"),g.Mb(35,"ion-label"),g.mc(36,"Server Start"),g.Lb(),g.Mb(37,"ion-toggle",6),g.Ub("ngModelChange",(function(e){return t.toggles.serverStartUp.toggle=e}))("ionChange",(function(){return t.saveToggle("SERVER_STARTED")})),g.Lb(),g.Lb(),g.Mb(38,"ion-item"),g.Mb(39,"ion-label"),g.mc(40,"Daten untersucht"),g.Lb(),g.Mb(41,"ion-toggle",6),g.Ub("ngModelChange",(function(e){return t.toggles.evaluateData.toggle=e}))("ionChange",(function(){return t.saveToggle("EVALUATE_DATA")})),g.Lb(),g.Lb(),g.Mb(42,"ion-item"),g.Mb(43,"ion-label"),g.mc(44,"Datenladen ohne L\xfccken"),g.Lb(),g.Mb(45,"ion-toggle",6),g.Ub("ngModelChange",(function(e){return t.fill=e}))("ionChange",(function(){return t.fill})),g.Lb(),g.Lb(),g.Lb(),g.Lb(),g.Lb(),g.Mb(46,"ion-row"),g.Mb(47,"ion-col",7),g.Mb(48,"ion-button",8),g.Ub("click",(function(){return t.calculateBusyTime()})),g.Kb(49,"ion-icon",9),g.mc(50,"\xa0 "),g.Lb(),g.Lb(),g.Mb(51,"ion-col",7),g.Mb(52,"ion-button",10),g.Ub("click",(function(){return t.evaluateData()})),g.Kb(53,"ion-icon",11),g.mc(54,"\xa0 "),g.Lb(),g.Lb(),g.Mb(55,"ion-col",7),g.Mb(56,"ion-button",12),g.Ub("click",(function(){return t.dumpData()})),g.Kb(57,"ion-icon",13),g.mc(58,"\xa0 "),g.Lb(),g.Lb(),g.Mb(59,"ion-col",7),g.Mb(60,"ion-button",14),g.Ub("click",(function(){return t.backupData()})),g.Kb(61,"ion-icon",15),g.mc(62,"\xa0 "),g.Lb(),g.Lb(),g.Mb(63,"ion-col",7),g.Mb(64,"ion-button",16),g.Kb(65,"ion-icon",17),g.mc(66,"\xa0 "),g.Lb(),g.Lb(),g.Lb(),g.Lb(),g.Lb()),2&e&&(g.bc("translucent",!0),g.zb(5),g.bc("fullscreen",!0),g.zb(12),g.bc("ngModel",t.toggles.createEntry.toggle),g.zb(4),g.bc("ngModel",t.toggles.deleteEntry.toggle),g.zb(4),g.bc("ngModel",t.toggles.recalculate.toggle),g.zb(4),g.bc("ngModel",t.toggles.backupDB.toggle),g.zb(4),g.bc("ngModel",t.toggles.dumpFS.toggle),g.zb(4),g.bc("ngModel",t.toggles.serverStartUp.toggle),g.zb(4),g.bc("ngModel",t.toggles.evaluateData.toggle),g.zb(4),g.bc("ngModel",t.fill),g.zb(19),g.bc("routerLink",g.dc(11,d)))},directives:[n.r,n.K,n.I,h.a,n.o,n.q,n.z,n.n,n.w,n.u,n.v,n.J,n.c,i.e,i.h,n.g,n.s,n.Q,s.h],styles:[""]}),e})();const m=[{path:"",component:p},{path:"user",loadChildren:()=>r.e(22).then(r.bind(null,"rNAG")).then(e=>e.UsersPageModule)},{path:"user/:id",loadChildren:()=>r.e(21).then(r.bind(null,"lE6Y")).then(e=>e.UserPageModule)}];let E=(()=>{class e{}return e.\u0275mod=g.Hb({type:e}),e.\u0275inj=g.Gb({factory:function(t){return new(t||e)},imports:[[s.i.forChild(m)],s.i]}),e})();var f=r("1tww");let M=(()=>{class e{}return e.\u0275mod=g.Hb({type:e}),e.\u0275inj=g.Gb({factory:function(t){return new(t||e)},imports:[[n.L,o.b,i.b,f.a,s.i.forChild([{path:"",component:p}]),E]]}),e})()},xUNR:function(e,t,r){"use strict";r.d(t,"a",(function(){return s}));class n{setData(e,t,r,n){this.id=e,this.name=t,this.toggle=r,this.notification=n}}class s{constructor(){this.createEntry=new n,this.deleteEntry=new n,this.backupDB=new n,this.dumpFS=new n,this.recalculate=new n,this.serverStartUp=new n,this.evaluateData=new n}getToggle(e){return"CREATE_ENTRY"==e?this.createEntry:"DELETE_ENTRY"==e?this.deleteEntry:"BACKUP_DB"==e?this.backupDB:"DUMP_FS"==e?this.dumpFS:"RECALCULATE"==e?this.recalculate:"SERVER_STARTED"==e?this.serverStartUp:"EVALUATE_DATA"==e?this.evaluateData:new n}setToggle(e){let t=new n;t.setData(e._id,e.name,e.toggle,e.notification),"CREATE_ENTRY"==e.name?this.createEntry=t:"DELETE_ENTRY"==e.name?this.deleteEntry=t:"BACKUP_DB"==e.name?this.backupDB=t:"DUMP_FS"==e.name?this.dumpFS=t:"RECALCULATE"==e.name?this.recalculate=t:"SERVER_STARTED"==e.name?this.serverStartUp=t:"EVALUATE_DATA"==e.name&&(this.evaluateData=t)}}}}]);