const logger = require('../api/config/logger'); // Logger configuration
/**
 * Read the version and build time from / package.json, increase the build number and set the build time to now
 * Usage: node bin/build.js [<ma|mi|b>]
 *   ma: increase major build number
 *   mi: increase minor build number
 *   b:  increase build number
 * no argument will increase the build number
 */

const fs = require('fs');
const yaml = require('js-yaml');
const { exec } = require('child_process');
const packageJson = require('../package.json');
const packageLockJson = require('../package-lock.json');

const openapiYaml = yaml.load(fs.readFileSync('./spec/openapi.yaml', 'utf8'));

const args = process.argv.slice(2);
if (args[0] === '--help') {
  logger.info('Usage: node bin/build.js [<ma|mi|b>]');
  process.exit(1);
}

let modified = false;
const versions = packageJson.version.split('.');
let majorVersion = parseInt(versions[0], 10);
let minorVersion = parseInt(versions[1], 10);
let buildVersion = parseInt(versions[2], 10);
if (args[0] === 'ma') {
  majorVersion++;
  minorVersion = 0;
  buildVersion = 0;
  modified = true;
}
if (args[0] === 'mi') {
  minorVersion++;
  buildVersion = 0;
  modified = true;
}
if (!args[0] || args[0] === '' || args[0] === 'b') {
  buildVersion++;
  modified = true;
}

if (!modified) { // only write file if version has changed
  logger.info('nothing to do, please check your parameters');
  logger.info('Usage: node bin/build.js [<ma|mi|b>]');
  process.exit(1);
} else {
  packageJson.version = `${majorVersion}.${minorVersion}.${buildVersion}`;
  packageJson.last_build = new Date();
  packageLockJson.version = `${majorVersion}.${minorVersion}.${buildVersion}`;
  openapiYaml.info.version = `${majorVersion}.${minorVersion}.${buildVersion}`;
  openapiYaml.info.lastUpdate = new Date().toISOString().split('T')[0];

  logger.info(`new version ${packageJson.version} lastUpdate ${packageJson.last_build}`);

  fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 4), 'UTF8');
  fs.writeFileSync('./package-lock.json', JSON.stringify(packageLockJson, null, 4), 'UTF8');
  fs.writeFileSync('./spec/openapi.json', JSON.stringify(openapiYaml, null, 4), 'UTF8');
  fs.writeFileSync('./spec/openapi.yaml', yaml.dump(openapiYaml), 'utf8');
  fs.writeFileSync('./VERSION', `${majorVersion}.${minorVersion}.${buildVersion}`);

  // tag the branch
  exec(`git tag ${majorVersion}.${minorVersion}.${buildVersion}`, (err) => {
    if (err) {
      logger.error(`exec error: ${err}`);
    }
  });
}
