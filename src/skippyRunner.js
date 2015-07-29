import colors from 'colors/safe';
import _ from 'lodash-contrib';
import config from './config';
import runnerTemplate from './runnerTemplate';
import phantomPool from './phantomPool';
import shard from './shard';
import testViewer from './testViewer';


function doRun(testFiles) {
  return new Promise((resolve, reject) => {
    let scriptFiles = [...config.srcFiles, ...testFiles];

    const runnerFileName = runnerTemplate.getRunnerFileName(testFiles.join(' '));
    runnerTemplate.createRunnerFile(scriptFiles, runnerFileName);

    phantomPool.openPage(
      'http://localhost:' + config.httpServerPort + '/' + runnerFileName,
      (page, finishFn, processIdx) => {
        let intervalId, ready = false;
        if (config.debug) {
          console.time(`[${processIdx}] ready page`);
        }

        function pageReady() {
          if (ready) {
            return;
          }
          ready = true;
          clearInterval(intervalId);

          if (config.debug) {
            console.timeEnd(`[${processIdx}] ready page`);
            console.time(`[${processIdx}] retrieve page data`);
          }

          page.evaluate(() => {
            return { relatedFiles: __relatedFiles__, testResults: __testResults__ };
          }, (result) => {
            if (config.debug) {
              console.timeEnd(`[${processIdx}] retrieve page data`);
            }
            finishFn();
            resolve(result);
          });
        }

        intervalId = setInterval(() => {
          page.evaluate(() => {
            return __done__;
          }, (result) => {
            result && pageReady();
          });
        }, 250);
      },
      (error) => {
        reject(error);
      }
    );
  });
}

function doShardedTestRun(testFiles) {
  return new Promise((resolve) => {
    console.time('doShardedRun');
    console.log(`Running ${testFiles.length} testFiles`);

    let promises = _.collect(shard(testFiles, config.maxProcesses), (testFilesShard) => {
      return doRun(testFilesShard);
    });

    Promise.all(promises).then((results) => {
      if (config.debug) {
        console.timeEnd('doShardedRun');
      }

      const relatedFiles = _.flatten(_.pluck(results, 'relatedFiles'));

      const testResults = _.clone(results[0].testResults);
      testResults.children = _.flatten(_.pluck(_.pluck(results, 'testResults'), 'children'));

      resolve({ testResults, relatedFiles });

    }).catch((error) => {
      console.log(colors.red('Error during sharded test run'));
      console.log(colors.red(error));
    });
  });
}

function getSrcTestRelation() {
  return doShardedTestRun(config.testFiles).then(({testResults, relatedFiles}) => {
    console.log(`Found ${relatedFiles.length} sets of related files`);
    if (config.debug) {
      console.log(relatedFiles);
    }

    testViewer.showTestResults(testResults);
    return relatedFiles;
  });
}

function runTests(testFiles) {
  return doShardedTestRun(testFiles).then(({testResults}) => {
    testViewer.showTestResults(testResults);
    return testResults;
  });
}


export default { getSrcTestRelation, runTests }
