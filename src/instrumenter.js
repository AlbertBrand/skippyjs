'use strict';

/* LIBRARIES */
import fs from 'fs-extra';
import chokidar from 'chokidar';

/* CUSTOM MODULES */
import fileReader from './fileReader';
import Instrumentify from './Intrumentify';
import { testSrcPath, tmpPath, coveragePath, templatePath, staticPath} from './config';
import server from './server';
import Coverage from './Coverage';


// cleanup & create folders
if (!fs.existsSync(tmpPath)) {
  fs.mkdirSync(tmpPath);
}
if (fs.existsSync(coveragePath)) {
  fs.removeSync(coveragePath)
}
fs.mkdirSync(coveragePath);

//read files
let {testFiles, codeFiles} = fileReader('testsrc');

// run instrumentation
let instruFiles = Instrumentify(codeFiles);

//serve static dirs
server.serve();

// run phantom
Coverage(instruFiles, testFiles);

// file watcher
//chokidar.watch(testSrcPath).on('all', function (event, path) {
//  console.log(event, path);
//});
