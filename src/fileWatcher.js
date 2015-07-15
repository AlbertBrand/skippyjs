import chokidar from 'chokidar';
import _ from 'lodash';
import config from './config';
import instrumenter from './instrumenter';
import runner from './skippyRunner';


function start(mapping) {
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
  chokidar.watch([...config.srcFiles, ...config.testFiles]).on('change', changedFile);
}


export default { start };
