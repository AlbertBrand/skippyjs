import fs from 'fs-extra';
import path from 'path';
import fileWatcher from 'chokidar';
import colors from 'colors';
import bootstrap from './bootstrap';
import instrumenter from './instrumenter';
import config from './config';
import server from './httpServer';
import runner from './skippyRunner';
// TODO provide config location via argument
import {srcFiles, testFiles} from '../skippyConfig';


console.log(colors.bgMagenta.white('SkippyJS'));
console.log(colors.bgMagenta.white('--------'));

bootstrap.cleanTmp();

instrumenter.writeInstrumented(srcFiles);

server.serve();

runner.initCoverage(srcFiles, testFiles);

fileWatcher.watch(config.testSrcPath).on('change', function (path) {
  runner.runTest(path);
});
