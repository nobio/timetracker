/**
 * Read the version and build time from / package.json, increase the build number and set the build time to now
 * Usage: node bin/build.js [<ma|mi|b>]
 *   ma: increase major build number
 *   mi: increase minor build number
 *   b:  increase build number
 * no argument will increase the build number
 */


const fs = require('fs');
const package_json = require('../package.json');

const arg = process.argv.slice(2);
if (arg == '--help') {
  console.log('Usage: node bin/build.js [<ma|mi|b>]');
  process.exit(1);
}

let modified = false;
const versions = package_json.version.split('.');
let major_version = parseInt(versions[0]);
let minor_version = parseInt(versions[1]);
let build_version = parseInt(versions[2]);
if (arg == 'ma') {
  major_version++;
  minor_version = 0;
  build_version = 0;
  modified = true;
}
if (arg == 'mi') {
  minor_version++;
  build_version = 0;
  modified = true;
}
if (!arg || arg == '' || arg == 'b') {
  build_version++;
  modified = true;
}

if (modified) { // only write file if version has changed
  package_json.version = `${major_version}.${minor_version}.${build_version}`;
  package_json.last_build = new Date();

  console.log(`new version ${package_json.version} last_build ${package_json.last_build}`);

  fs.writeFileSync(
    './package.json',
    JSON.stringify(package_json, null, 4),
    'UTF8',
  );
}
