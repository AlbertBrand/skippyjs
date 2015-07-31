import chokidar from 'chokidar';
import _ from 'lodash';
import config from './config';
import instrumenter from './instrumenter';
import runner from './skippyRunner';
import testViewer from './testViewer';


function runAndShowTestResults(testFiles) {
  runner.runTests(testFiles).then((results) => {
    testViewer.showTestResults(results.testResults);
  });
}

function start(relatedFiles) {
  function getRelatedTestFiles(srcFile) {
    const relatedTestFiles = [];
    _.forEach(relatedFiles, (related) => {
      if (_.includes(related, srcFile)) {
        let intersection = _.intersection(related, config.testFiles);
        relatedTestFiles.push(...intersection);
      }
    });
    return relatedTestFiles;
  }

  function changedFile(file) {
    if (_.includes(config.instrumentFiles, file)) {
      if (config.verbose) {
        console.log('Instrumented source file changed, running related tests');
      }
      instrumenter.writeInstrumented([file]);
      runAndShowTestResults(getRelatedTestFiles(file));

    } else if (_.includes(config.srcFiles, file)) {
      if (config.verbose) {
        console.log('Non-instrumented source file changed, running all tests');
      }
      runAndShowTestResults(config.testFiles);

    } else if (_.includes(config.testFiles, file)) {
      if (config.verbose) {
        console.log('Test file changed, running single test');
      }
      instrumenter.writeInstrumented([file]);
      runAndShowTestResults([file]);
    }
  }

  console.log('Watching file changes');
  chokidar.watch([...config.srcFiles, ...config.testFiles]).on('change', changedFile);
}


export default { start };
