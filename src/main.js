import config from './config'; // make sure config is imported first
import cli from './cli';
import bootstrap from './bootstrap';
import instrumenter from './instrumenter';
import server from './httpServer';
import runner from './skippyRunner';
import phantomPool from './phantomPool';
import fileWatcher from './fileWatcher';
import karmaPreprocessor from './karmaPreprocessor'
import testHelper from './testHelper'


console.time('SkippyJS ready in');

phantomPool.boot();

bootstrap.cleanTmp();

karmaPreprocessor.process();

instrumenter.writeInstrumented([...config.instrumentFiles, ...config.testFiles]);

server.serve();

if (cli.options.singleRun) {
  runner.runTests(config.testFiles).then((testResults) => {
    if (config.debug) {
      console.timeEnd('SkippyJS ready in');
    }
    process.exit(testHelper.hasFailedTests(testResults) ? 1 : 0);
  });

} else {
  runner.getSrcTestRelation().then((relatedFiles) => {
    fileWatcher.start(relatedFiles);
    if (config.debug) {
      console.timeEnd('SkippyJS ready in');
    }
  });
}
