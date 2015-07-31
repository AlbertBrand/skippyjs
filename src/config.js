import path from 'path';
import glob from 'glob-all';
import colors from 'colors';
import fs from 'fs-extra';
import _ from 'lodash';
import cli from './cli';


// initialise dynamic settings via commandline config file
if (!cli.config.configFile) {
  cli.program.outputHelp();
  process.exit(1);
}

const configFile = process.cwd() + '/' + cli.config.configFile;
if (!fs.existsSync(configFile)) {
  console.log(colors.red('Config file does not exist'));
  process.exit(1);
}

let config;
try {
  config = require(configFile);
} catch (e) {
  console.log(colors.red('Config file contains errors:'));
  console.log(e.message);
  process.exit(1);
}

const root = path.resolve(__dirname, '..') + '/';

config = _.extend(config, cli.config);

const testFramework = config.testFramework || undefined;
const srcFiles = glob.sync(config.srcFiles || []);
const instrumentFiles = glob.sync(config.instrumentFiles || []);
const testFiles = glob.sync(config.testFiles || []);
const staticFiles = glob.sync(config.staticFiles || []); // TODO
const maxProcesses = config.maxProcesses || 8;
const preprocessors = config.preprocessors || {};
const storeCoverage = config.storeCoverage || false;
const tmpPath = config.tmpPath || (root + '.tmp/');
const httpServerPort = config.httpServerPort || 3000;
const runOnce = config.runOnce || false;
const verbose = config.verbose || false;

if (!testFramework) {
  console.log(colors.red('Test framework not defined'));
  process.exit(1);
}

const templatePath = root + 'template/';
const staticPath = root + 'static/';
const coveragePath = tmpPath + 'coverage/';
const generatedPath = tmpPath + 'generated/';

srcFiles.unshift('instrumentHelper.js');

if (testFramework.startsWith('jasmine')) {
  srcFiles.unshift(...[
    'jasmine/' + testFramework + '/jasmine.js',
    'jasmine/' + testFramework + '/jasmine-html.js',
    'jasmine/' + testFramework + '/boot.js',
    'jasmine/' + testFramework + '/jasmineSkippyBridge.js'
  ]);
}


export default {
  testFramework,
  srcFiles,
  instrumentFiles,
  testFiles,
  staticFiles,
  maxProcesses,
  preprocessors,
  storeCoverage,
  tmpPath,
  httpServerPort,
  runOnce,
  verbose,

  templatePath,
  staticPath,
  coveragePath,
  generatedPath
}
