import colors from 'colors';
import config from './config'; // make sure config is imported first
import bootstrap from './bootstrap';
import instrumenter from './instrumenter';
import server from './httpServer';
import runner from './skippyRunner';
import phantomPool from './phantomPool';
import fileWatcher from './fileWatcher';
import karmaPreprocessor from './karmaPreprocessor'
import testViewer from './testViewer'
import testHelper from './testHelper'


console.log(colors.bgGreen.black('SkippyJS, the faster test runner'));

console.time('SkippyJS ready in');

phantomPool.boot();

bootstrap.cleanTmp();

karmaPreprocessor.process();

instrumenter.writeInstrumented([...config.instrumentFiles, ...config.testFiles]);

server.serve();

runner.runTests(config.testFiles, config.storeCoverage).then((results) => {
  if (config.verbose) {
    console.timeEnd('SkippyJS ready in');
  }

  if (config.storeCoverage) {
    instrumenter.writeCoverage(results.coverage);
  }

  testViewer.showTestResults(results.testResults);

  if (config.runOnce) {
    process.exit(testHelper.hasFailedTests(results.testResults) ? 1 : 0);
  }

  console.log(`Found ${results.relatedFiles.length} sets of related files`);
  if (config.verbose) {
    console.log(results.relatedFiles);
  }

  fileWatcher.start(results.relatedFiles);
});
