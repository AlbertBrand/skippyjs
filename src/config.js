import path from 'path';
import glob from 'glob-all';
import colors from 'colors';
import fs from 'fs-extra';
import cli from './cli';


// internal settings
const root = path.resolve(__dirname, '..') + '/';

const templatePath = root + 'template/';
const staticPath = root + 'static/';

const tmpPath = root + '.tmp/';
const coveragePath = tmpPath + 'coverage/';
const generatedPath = tmpPath + 'generated/';

const httpServerPort = 3000;

// initialise dynamic settings via commandline config file
if (!cli.options.configFile) {
  cli.program.outputHelp();
  process.exit(1);
}

const configFile = process.cwd() + '/' + cli.options.configFile;
if (!fs.existsSync(configFile)) {
  console.log(colors.red('Config file does not exist'));
  process.exit(1);
}

/**
 * @type {{
   *  testFramework,
   *  srcFiles,
   *  instrumentFiles,
   *  testFiles,
   *  staticFiles,
   *  maxProcesses,
   *  preprocessors,
   *  storeCoverage,
   *  debug
   * }}
 */
let config;
try {
  config = require(configFile);
} catch (e) {
  console.log(colors.red('Config file contains errors:'));
  console.log(e.message);
  process.exit(1);
}

const srcFiles = glob.sync(config.srcFiles || []);
const instrumentFiles = glob.sync(config.instrumentFiles || []);
const testFiles = glob.sync(config.testFiles || []);
const staticFiles = glob.sync(config.staticFiles || []); // TODO
const maxProcesses = config.maxProcesses || 8;
const preprocessors = config.preprocessors || {};
const storeCoverage = config.storeCoverage || false;
const debug = config.debug || false;

srcFiles.unshift('instrumentHelper.js');

if (config.testFramework.startsWith('jasmine')) {
  srcFiles.unshift(...[
    'jasmine/' + config.testFramework + '/jasmine.js',
    'jasmine/' + config.testFramework + '/jasmine-html.js',
    'jasmine/' + config.testFramework + '/boot.js',
    'jasmine/' + config.testFramework + '/jasmineSkippyBridge.js'
  ]);
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
  preprocessors,
  storeCoverage,
  debug
}
