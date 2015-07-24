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

    console.log(`Running ${testFiles.length} testFiles`);
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

function getSrcTestRelation() {
  return new Promise((resolve) => {
    console.time('getSrcTestRelation');

    let promises = _.collect(shard(config.testFiles, config.maxProcesses), (testFiles) => {
      return doRun(testFiles);
    });

    Promise.all(promises).then((results) => {
      let relatedFiles = _.flatten(_.pluck(results, 'relatedFiles'));
      console.log(`Found ${relatedFiles.length} sets of related files`);

      if (config.debug) {
        console.log(relatedFiles);
        console.timeEnd('getSrcTestRelation');
      }

      const testResults = _.reduce(_.pluck(results, 'testResults'), (acc, val) => {
        return _.extend(acc, val, (a, b) => {
          return _.isArray(b) ? b.concat(a) : b;
        });
      });

      testViewer.showTestResults(testResults);

      resolve(relatedFiles);

    }).catch((error) => {
      console.log(colors.red('Error during getSrcTestRelation, fix and restart'));
      console.log(colors.red(error));
    });
  });
}

function runTests(testFiles) {
  // TODO shard
  doRun(testFiles).then((result) => {
    testViewer.showTestResults(result.testResults);

  }).catch((error) => {
    console.log(colors.red('Error during test run of', testFiles));
    console.log(colors.red(error.msg));
  });
}

function close() {
  phantomPool.close();
}


export default { getSrcTestRelation, runTests, close }
