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

    if (config.debug) {
      console.log(`Running ${testFiles.length} testfiles`);
    }
    phantomPool.openPage(
      'http://localhost:' + config.httpServerPort + '/' + runnerFileName,
      (page, processIdx) => {
        console.time('page.evaluate process ' + processIdx);
        page.evaluate(() => {
          return { relatedFiles: __relatedFiles__, testResults: __testResults__ };
        }, (result) => {
          console.timeEnd('page.evaluate process ' + processIdx);
          resolve(result);
        });
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
      if (config.debug) {
        console.log('Source files and their related tests:');
        console.log(results[0].relatedFiles);
        console.timeEnd('getSrcTestRelation');
      }

      resolve(results[0].relatedFiles);

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
