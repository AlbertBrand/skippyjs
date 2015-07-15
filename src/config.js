import glob from 'glob-all';
import colors from 'colors';


// internal settings
const path = require('path');
const root = path.resolve(__dirname, '..') + '/';

const templatePath = root + 'template/';
const staticPath = root + 'static/';

const tmpPath = root + '.tmp/';
const coveragePath = tmpPath + 'coverage/';
const generatedPath = tmpPath + 'generated/';

const httpServerPort = 3000;

// initialise dynamic settings via commandline config file
const args = process.argv.slice(2);
if (args.length == 0) {
  console.log(colors.red('No path provided to skippy config'));
  process.exit(1);
}

/**
 * @type {{testFramework, srcFiles, instrumentFiles, testFiles, staticFiles, maxProcesses, debug}}
 */
const config = require(process.cwd() + path.sep + args[0]);

let srcFiles = glob.sync(config.srcFiles || []);
const instrumentFiles = glob.sync(config.instrumentFiles || []);
const testFiles = glob.sync(config.testFiles || []);
const staticFiles = glob.sync(config.staticFiles || []); // TODO
const maxProcesses = config.maxProcesses || 8;
const debug = config.debug || false;

if (config.testFramework.startsWith('jasmine')) {
  srcFiles = [
    'jasmine/' + config.testFramework + '/jasmine.js',
    'jasmine/' + config.testFramework + '/jasmine-html.js',
    'jasmine/' + config.testFramework + '/boot.js',
    'jasmine/jasmine-json-reporter.js'
  ].concat(srcFiles);
}


export default {
  templatePath,
  staticPath,
  tmpPath,
  coveragePath,
  generatedPath,
  httpServerPort,

  srcFiles,
  instrumentFiles,
  testFiles,
  staticFiles,
  maxProcesses,
  debug
}
