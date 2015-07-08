import fs from 'fs-extra';
import path from 'path';
import fileWatcher from 'chokidar';
import colors from 'colors';
import bootstrap from './bootstrap';
import instrumenter from './instrumenter';
import server from './httpServer';
import runner from './skippyRunner';
import phantomPool from './phantomPool';
// TODO provide config location via argument
import {srcFiles, testFiles, maxProcesses} from '../skippyConfig';


console.log(colors.bgMagenta.white('SkippyJS'));
console.log(colors.bgMagenta.white('--------'));

phantomPool.boot(maxProcesses);

bootstrap.cleanTmp();

instrumenter.writeInstrumented(srcFiles);

server.serve();

runner.getSrcTestMapping(srcFiles, testFiles).then((mapping) => {
  function changedFile(file) {
    if (mapping[file]) {
      console.log('Source file changed');
      instrumenter.writeInstrumented([file]);
      for (let testFile of mapping[file]) {
        runner.runTest(srcFiles, testFile);
      }
    } else {
      console.log('Test file changed');
      runner.runTest(srcFiles, file);
    }
  }

  fileWatcher.watch([...srcFiles, ...testFiles]).on('change', changedFile);
});
