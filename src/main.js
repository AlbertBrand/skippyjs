import fs from 'fs-extra';
import path from 'path';
import fileWatcher from 'chokidar';
import colors from 'colors';
import glob from 'glob-all';
import _ from 'lodash';
import bootstrap from './bootstrap';
import instrumenter from './instrumenter';
import server from './httpServer';
import runner from './skippyRunner';
import phantomPool from './phantomPool';

const args = process.argv.slice(2);
if (args.length == 0) {
  console.log(colors.red('No path provided to skippy config'));
  process.exit(1);
}
/**
 * @type {{instrumentFiles, srcFiles, testFiles, staticFiles, maxProcesses, debug}}
 */
const config = require(process.cwd() + path.sep + args[0]);

const srcFiles = glob.sync(config.srcFiles);
const instrumentFiles = glob.sync(config.instrumentFiles);
const testFiles = glob.sync(config.testFiles);
const staticFiles = glob.sync(config.staticFiles); // TODO
const debug = config.debug;


console.log(colors.bgMagenta.white('SkippyJS'));
console.log(colors.bgMagenta.white('--------'));

phantomPool.boot(config.maxProcesses);

bootstrap.cleanTmp();

instrumenter.writeInstrumented(instrumentFiles, debug);

// TODO serve only configured files
server.serve();

runner.getSrcTestMapping(srcFiles, testFiles).then((mapping) => {
  function changedFile(file) {
    if (_.includes(instrumentFiles, file)) {
      if (debug) {
        console.log('Instrumented source file changed');
      }
      instrumenter.writeInstrumented([file]);
      for (let testFile of mapping[file]) {
        runner.runTest(srcFiles, testFile);
      }

    } else if (_.includes(srcFiles, file)) {
      if (debug) {
        console.log('Non-instrumented source file changed');
      }
      // TODO decide what to do here

    } else if (_.includes(testFiles, file)) {
      if (debug) {
        console.log('Test file changed');
      }
      runner.runTest(srcFiles, file);
    }
  }

  console.log('Watching file changes');
  fileWatcher.watch([...srcFiles, ...testFiles]).on('change', changedFile);
});
