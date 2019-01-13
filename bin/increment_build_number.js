#!/usr/bin/env node

// Save hook under `project-root/hooks/before_prepare/`
//
// Don't forget to install xml2js using npm
// `$ npm install xml2js`

const moment = require('moment');

// Read files
let v = require('../VERSION');
let p = require('../package.json');
const fs = require('fs');

const v0 = v.version.split('.')[0];
const v1 = v.version.split('.')[1];
const v2 = parseInt(v.version.split('.')[2]) + 1;
v.version = v0 + '.' + v1 + '.' + v2;

p.version = v.version;
p.last_build = moment().format('YYYY-MM-DD HH:mm:ss');
console.log(p.version)
console.log(p.last_build)

fs.writeFileSync('./VERSION.json', JSON.stringify(v, null, '  '));
fs.writeFileSync('./package.json', JSON.stringify(p, null, '  '));

