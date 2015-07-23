import colors from 'colors/safe';
import _ from 'lodash';
import config from './config';
import runnerTemplate from './runnerTemplate';
import phantomPool from './phantomPool';


function doRun(testFiles) {
  return new Promise((resolve, reject) => {
    let scriptFiles = [...config.srcFiles, ...testFiles];

    const runnerFileName = runnerTemplate.getRunnerFileName(testFiles.join(' '));
    runnerTemplate.createRunnerFile(scriptFiles, runnerFileName);

    console.log(`Running ${testFiles.length} tests`);
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
    // TODO shard
    let promises = [doRun(config.testFiles)];

    Promise.all(promises).then((results) => {
      const relatedFiles = results[0].relatedFiles;
      console.log(`Found ${relatedFiles.length} sets of related files`);

      if (config.debug) {
        console.log(relatedFiles);
        console.timeEnd('getSrcTestRelation');
      }

      resolve(relatedFiles);

    }).catch((error) => {
      console.log(colors.red('Error during getSrcTestRelation, fix and restart'));
      console.log(colors.red(error.msg));
    });
  });
}

function runTests(testFiles) {
  doRun(testFiles).then((result) => {
    console.log(_.all(result.testResults, 'status', 'passed') ?
        colors.bgGreen.black(`Test succeeded: ${testFiles}`) :
        colors.bgRed(`Test failed: ${testFiles}`)
    );

    for (let testResult of result.testResults) {
      if (testResult.status === 'passed') {
        console.log(colors.green(testResult.description));
      } else {
        console.log(colors.red(testResult.description));
        console.log('Failed expectations:');
        console.log(_.pluck(testResult.failedExpectations, 'message').join('\n'));
      }
    }

  }).catch((error) => {
    console.log(colors.red('Error during test run of', testFiles));
    console.log(colors.red(error.msg));
  });
}

function close() {
  phantomPool.close();
}


export default { getSrcTestRelation, runTests, close }
