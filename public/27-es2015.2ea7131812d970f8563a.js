(window.webpackJsonp=window.webpackJsonp||[]).push([[27],{y3DM:function(t,e,n){"use strict";n.r(e),n.d(e,"ComeGoPageModule",(function(){return g}));var i=n("ofXK"),o=n("3Pt+"),r=n("TEn/"),a=n("tyNb"),s=n("mrSG"),l=n("MO+k"),c=n("2pNN"),h=n("sPAB"),b=n("fXoL"),d=n("1Yyo");const u=["lineCanvas"],p=[{path:"",component:(()=>{class t{constructor(t,e,n,i){this.navCtrl=t,this.alertCtrl=e,this.statsSrv=n,this.actionSheetCtrl=i,this._interval=40,this._direction=void 0}ionViewDidEnter(){this.initGraph(),this.loadGraphData()}set interval(t){this._interval=t<1?1:t,this.loadGraphData()}get interval(){return this._interval}set direction(t){this._direction="all"===t.toString()?void 0:t,this.loadGraphData()}get direction(){return this._direction}initGraph(){this.lineChart=new l.Chart(this.lineCanvas.nativeElement,{type:"bar",responsive:!0,data:{datasets:[{label:"Anwesenheit pro Zeiteinheit",fill:!1,backgroundColor:"rgb(52, 102, 189)",borderColor:"rgb(52, 102, 189)",hoverBackgroundColor:"rgb(6, 175, 34)",hoverBorderColor:"rgb(6, 175, 34)",hoverBorderWidth:4}]},options:{scales:{xAxes:[{ticks:{maxRotation:60}}]}}})}loadGraphData(){this.statsSrv.loadStatisticHistogramDataByInterval(this.interval,this.direction).then(t=>{this.updateGraph(t,this.lineChart)}).catch(t=>{h.a.alert(this.alertCtrl,t)})}updateGraph(t,e){let n=[],i=[];for(let o=0;o<t.data.length;o++)n.push(t.data[o].x),i.push(t.data[o].y);e.data.labels=n,e.data.datasets[0].data=i,e.update({duration:600,easing:"easeOutBounce"})}showDirectionDialog(){return Object(s.a)(this,void 0,void 0,(function*(){const t=yield this.actionSheetCtrl.create({header:"Richtung (Kommen/Gehen)",buttons:[{text:"Alle",handler:()=>{this.direction=c.a.none}},{text:"Kommen",icon:"enter",handler:()=>{this.direction=c.a.enter}},{text:"Gehen",icon:"exit",handler:()=>{this.direction=c.a.go}},{text:"Abbrechen",role:"cancel"}]});yield t.present()}))}}return t.\u0275fac=function(e){return new(e||t)(b.Jb(r.O),b.Jb(r.b),b.Jb(d.a),b.Jb(r.a))},t.\u0275cmp=b.Db({type:t,selectors:[["app-come-go"]],viewQuery:function(t,e){var n;1&t&&b.rc(u,!0),2&t&&b.fc(n=b.Vb())&&(e.lineCanvas=n.first)},decls:20,vars:1,consts:[["slot","start"],["color","primary","text","Zur\xfcck","defaultHrf","/entries"],["size","12","size-sm","8","offset-sm","2"],["min","1","max","60","step","1","snaps","false","pin","true","color","primary","debounce","500",3,"ngModel","ngModelChange"],["slot","end",3,"click"],["height","400px"],["lineCanvas",""]],template:function(t,e){1&t&&(b.Mb(0,"ion-header"),b.Mb(1,"ion-toolbar"),b.Mb(2,"ion-title"),b.mc(3,"Kommen & Gehen"),b.Lb(),b.Mb(4,"ion-buttons",0),b.Kb(5,"ion-back-button",1),b.Lb(),b.Lb(),b.Lb(),b.Mb(6,"ion-content"),b.Mb(7,"ion-grid"),b.Mb(8,"ion-row"),b.Mb(9,"ion-col",2),b.Mb(10,"ion-item"),b.Mb(11,"ion-range",3),b.Ub("ngModelChange",(function(t){return e.interval=t})),b.Lb(),b.Mb(12,"ion-button",4),b.Ub("click",(function(){return e.showDirectionDialog()})),b.mc(13,"Direction"),b.Lb(),b.Lb(),b.Lb(),b.Lb(),b.Mb(14,"ion-row"),b.Mb(15,"ion-col",2),b.Mb(16,"ion-card"),b.Mb(17,"ion-card-content"),b.Kb(18,"canvas",5,6),b.Lb(),b.Lb(),b.Lb(),b.Lb(),b.Lb(),b.Lb()),2&t&&(b.zb(11),b.bc("ngModel",e.interval))},directives:[r.r,r.K,r.I,r.h,r.e,r.f,r.o,r.q,r.z,r.n,r.u,r.x,r.R,o.e,o.h,r.g,r.i,r.j],styles:[""]}),t})()}];let v=(()=>{class t{}return t.\u0275mod=b.Hb({type:t}),t.\u0275inj=b.Gb({factory:function(e){return new(e||t)},imports:[[a.i.forChild(p)],a.i]}),t})(),g=(()=>{class t{}return t.\u0275mod=b.Hb({type:t}),t.\u0275inj=b.Gb({factory:function(e){return new(e||t)},imports:[[i.b,o.b,r.L,v]]}),t})()}}]);