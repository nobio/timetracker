function _defineProperty(t,o,e){return o in t?Object.defineProperty(t,o,{value:e,enumerable:!0,configurable:!0,writable:!0}):t[o]=e,t}function _classCallCheck(t,o){if(!(t instanceof o))throw new TypeError("Cannot call a class as a function")}function _defineProperties(t,o){for(var e=0;e<o.length;e++){var n=o[e];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}function _createClass(t,o,e){return o&&_defineProperties(t.prototype,o),e&&_defineProperties(t,e),t}(window.webpackJsonp=window.webpackJsonp||[]).push([[35],{Q2Bp:function(t,o,e){"use strict";e.r(o),e.d(o,"ion_backdrop",(function(){return i}));var n=e("wEJo"),a=e("E/Mt"),r=e("y08P"),i=function(){function t(o){_classCallCheck(this,t),Object(n.o)(this,o),this.ionBackdropTap=Object(n.g)(this,"ionBackdropTap",7),this.blocker=r.a.createBlocker({disableScroll:!0}),this.visible=!0,this.tappable=!0,this.stopPropagation=!0}return _createClass(t,[{key:"connectedCallback",value:function(){this.stopPropagation&&this.blocker.block()}},{key:"disconnectedCallback",value:function(){this.blocker.unblock()}},{key:"onMouseDown",value:function(t){this.emitTap(t)}},{key:"emitTap",value:function(t){this.stopPropagation&&(t.preventDefault(),t.stopPropagation()),this.tappable&&this.ionBackdropTap.emit()}},{key:"render",value:function(){var t,o=Object(a.b)(this);return Object(n.j)(n.c,{tabindex:"-1","aria-hidden":"true",class:(t={},_defineProperty(t,o,!0),_defineProperty(t,"backdrop-hide",!this.visible),_defineProperty(t,"backdrop-no-tappable",!this.tappable),t)})}}]),t}();i.style={ios:":host{left:0;right:0;top:0;bottom:0;display:block;position:absolute;-webkit-transform:translateZ(0);transform:translateZ(0);contain:strict;cursor:pointer;opacity:0.01;-ms-touch-action:none;touch-action:none;z-index:2}:host(.backdrop-hide){background:transparent}:host(.backdrop-no-tappable){cursor:auto}:host{background-color:var(--ion-backdrop-color, #000)}",md:":host{left:0;right:0;top:0;bottom:0;display:block;position:absolute;-webkit-transform:translateZ(0);transform:translateZ(0);contain:strict;cursor:pointer;opacity:0.01;-ms-touch-action:none;touch-action:none;z-index:2}:host(.backdrop-hide){background:transparent}:host(.backdrop-no-tappable){cursor:auto}:host{background-color:var(--ion-backdrop-color, #000)}"}}}]);