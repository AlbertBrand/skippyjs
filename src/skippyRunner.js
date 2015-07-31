import colors from 'colors/safe';
import _ from 'lodash-contrib';
import config from './config';
import runnerTemplate from './runnerTemplate';
import phantomPool from './phantomPool';
import shard from './shard';
import instrumenter from './instrumenter';


function doRun(testFiles, storeCoverage) {
  return new Promise((resolve, reject) => {
    let scriptFiles = [...config.srcFiles, ...testFiles];

    const runnerFileName = runnerTemplate.getRunnerFileName(testFiles.join(' '));
    runnerTemplate.createRunnerFile(scriptFiles, runnerFileName);

    phantomPool.openPage(
      'http://localhost:' + config.httpServerPort + '/' + runnerFileName,
      (page, finishFn, processIdx) => {
        let intervalId, ready = false;
        if (config.verbose) {
          console.time(`[${processIdx}] ready page`);
        }

        function pageReady() {
          if (ready) {
            return;
          }
          ready = true;
          clearInterval(intervalId);

          if (config.verbose) {
            console.timeEnd(`[${processIdx}] ready page`);
            console.time(`[${processIdx}] retrieve page data`);
          }

          // no closures allowed in evalFn
          const evalFn = storeCoverage ? () => {
            //noinspection JSUnresolvedVariable
            return {
              relatedFiles: __relatedFiles__,
              testResults: __testResults__,
              coverage: __coverage__
            };
          } : () => {
            return {
              relatedFiles: __relatedFiles__,
              testResults: __testResults__
            };
          };

          page.evaluate(evalFn, (result) => {
            if (config.verbose) {
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

function runTests(testFiles, storeCoverage) {
  return new Promise((resolve) => {
    console.time('runTests');
    console.log(`Running ${testFiles.length} testFiles`);

    let promises = _.collect(shard(testFiles, config.maxProcesses), (testFilesShard) => {
      return doRun(testFilesShard, storeCoverage);
    });

    Promise.all(promises).then((results) => {
      if (config.verbose) {
        console.timeEnd('runTests');
      }

      const relatedFiles = _.flatten(_.pluck(results, 'relatedFiles'));

      const testResults = _.clone(results[0].testResults);
      testResults.children = _.flatten(_.pluck(_.pluck(results, 'testResults'), 'children'));

      const coverage = storeCoverage ? instrumenter.combine(_.pluck(results, 'coverage')) : null;

      resolve({ testResults, relatedFiles, coverage });

    }).catch((error) => {
      console.log(colors.red('Error during sharded test run'));
      console.log(colors.red(error.msg || error));
    });
  });
}


export default { runTests }
