import fs from 'fs-extra';
import path from 'path';
import fileWatcher from 'chokidar';
import colors from 'colors';
import bootstrap from './bootstrap';
import fileReader from './fileReader';
import instrumenter from './instrumenter';
import config from './config';
import server from './httpServer';
import runner from './skippyRunner';


console.log(colors.bgMagenta.white('SkippyJS'));
console.log(colors.bgMagenta.white('--------'));


bootstrap.cleanTmp();

let {testFiles, codeFiles} = fileReader(path.parse(config.testSrcPath).name);

let instruFiles = instrumenter.writeInstrumented(codeFiles);

server.serve();

runner.initCoverage(instruFiles, testFiles);

fileWatcher.watch(config.testSrcPath).on('change', function (path) {
  runner.runTest(path);
});
