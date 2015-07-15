import fs from 'fs-extra';
import path from 'path';
import fileWatcher from 'chokidar';
import colors from 'colors';
import _ from 'lodash';
import config from './config'; // make sure config is loaded first
import bootstrap from './bootstrap';
import instrumenter from './instrumenter';
import server from './httpServer';
import runner from './skippyRunner';
import phantomPool from './phantomPool';


console.log(colors.bgMagenta.white('SkippyJS'));
console.log(colors.bgMagenta.white('--------'));

phantomPool.boot();

bootstrap.cleanTmp();

instrumenter.writeInstrumented(config.instrumentFiles);

// TODO serve only configured files
server.serve();

runner.getSrcTestMapping().then((mapping) => {
  function changedFile(file) {
    if (_.includes(config.instrumentFiles, file)) {
      if (config.debug) {
        console.log('Instrumented source file changed');
      }
      instrumenter.writeInstrumented([file]);
      for (let testFile of mapping[file]) {
        runner.runTest(testFile);
      }

    } else if (_.includes(config.srcFiles, file)) {
      if (config.debug) {
        console.log('Non-instrumented source file changed');
      }
      // TODO decide what to do here

    } else if (_.includes(config.testFiles, file)) {
      if (config.debug) {
        console.log('Test file changed');
      }
      runner.runTest(file);
    }
  }

  console.log('Watching file changes');
  fileWatcher.watch([...config.srcFiles, ...config.testFiles]).on('change', changedFile);
});
