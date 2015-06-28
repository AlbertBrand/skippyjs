import fs from 'fs-extra';
import path from 'path';
import fileWatcher from 'chokidar';
import colors from 'colors';
import bootstrap from './bootstrap';
import instrumenter from './instrumenter';
import server from './httpServer';
import runner from './skippyRunner';
// TODO provide config location via argument
import {srcFiles, testFiles} from '../skippyConfig';


console.log(colors.bgMagenta.white('SkippyJS'));
console.log(colors.bgMagenta.white('--------'));

bootstrap.cleanTmp();

instrumenter.writeInstrumented(srcFiles);

server.serve();

runner.initCoverage(srcFiles, testFiles).then((diffResult) => {
  function changedFile(file) {
    if (diffResult[file]) {
      console.log('Source file changed');
      instrumenter.writeInstrumented([file]);
      for (let testFile of diffResult[file]) {
        runner.runTest(srcFiles, testFile);
      }
    } else {
      console.log('Test file changed');
      runner.runTest(srcFiles, file);
    }
  }

  fileWatcher.watch([...srcFiles, ...testFiles]).on('change', changedFile);
});
