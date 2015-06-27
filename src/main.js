/* LIBRARIES */
import fs from 'fs-extra';
import chokidar from 'chokidar';

/* CUSTOM MODULES */
import fileReader from './fileReader';
import instrumenter from './instrumenter';
import { testSrcPath, tmpPath, coveragePath, templatePath, staticPath} from './config';
import server from './httpServer';
import runner from './skippyRunner';

// cleanup & create folders
if (!fs.existsSync(tmpPath)) {
  fs.mkdirSync(tmpPath);
}
if (fs.existsSync(coveragePath)) {
  fs.removeSync(coveragePath)
}
fs.mkdirSync(coveragePath);

// find spec & code files
let {testFiles, codeFiles} = fileReader('testsrc');

let instruFiles = instrumenter.writeInstrumented(codeFiles);

server.serve();

runner.initCoverage(instruFiles, testFiles);

// file watcher
chokidar.watch(testSrcPath).on('change', function (path) {
  runner.runTest(path);
});
