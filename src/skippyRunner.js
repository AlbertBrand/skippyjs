import fs from 'fs-extra';
import path from 'path';
import mkdirp from 'mkdirp';
import colors from 'colors/safe';
import _ from 'lodash';
import config from './config';
import runnerTemplate from './runnerTemplate';
import phantomPool from './phantomPool';


const NO_TEST = 'no-test';

function doRun(testFile) {
  return new Promise((resolve, reject) => {
    let scriptFiles = [...config.srcFiles];
    if (testFile !== NO_TEST) {
      scriptFiles.push(testFile);
    }

    const runnerFileName = runnerTemplate.getRunnerFileName(testFile);
    runnerTemplate.createRunnerFile(scriptFiles, runnerFileName);

    if (config.debug) {
      console.log('Running', testFile);
    }
    phantomPool.openPage(
      'http://localhost:' + config.httpServerPort + '/' + runnerFileName,
      (page) => {
        page.evaluate(() => {
          //noinspection JSUnresolvedVariable
          return { coverage: __coverage__, testResults: __testResults__ };
        }, (result) => {
          resolve({ testFile, coverage: result.coverage, testResults: result.testResults });
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
}

function getCoverage(testFile) {
  return doRun(testFile).then((result) => {
    if (config.debug) {
      console.log('Writing coverage to disk for', testFile);
    }
    const coverageName = path.parse(testFile).base + '.json';
    const destPath = config.coveragePath + path.parse(testFile).dir;
    mkdirp.sync(destPath);
    fs.writeFileSync(destPath + '/' + coverageName, JSON.stringify(result.coverage), 'utf8');
    return result;
  });
}

function getSrcTestMapping() {
  return new Promise((resolve) => {
    let promises = [getCoverage(NO_TEST), ..._.map(config.testFiles, (testFile) => {
      return getCoverage(testFile);
    })];

    Promise.all(promises).then((result) => {
      if (config.debug) {
        console.log('Diffing coverage reports...');
      }

      let noTestCoverage = _.find(result, 'testFile', NO_TEST).coverage;
      let mapping = {};

      for (let testFile of config.testFiles) {
        let testCoverage = _.find(result, 'testFile', testFile).coverage;
        for (let instrumentedFile in noTestCoverage) {
          let testStmtCov = testCoverage[instrumentedFile].s;
          let noTestStmtCov = noTestCoverage[instrumentedFile].s;
          for (let i in noTestStmtCov) {
            if (testStmtCov[i] != noTestStmtCov[i]) {
              if (!mapping[instrumentedFile]) {
                mapping[instrumentedFile] = [];
              }
              mapping[instrumentedFile].push(testFile);
              break;
            }
          }
        }
      }

      console.log('Source files and their related tests:');
      console.log(mapping);
      resolve(mapping);

    }).catch((error) => {
      console.log(colors.red('Error during mapping phase, fix and restart'));
      console.log(colors.red(error.msg));
    });
  });
}

function runTest(testFile) {
  doRun(testFile).then((result) => {
    console.log(_.all(result.testResults, 'status', 'passed') ?
        colors.bgGreen.black(`Test succeeded: ${testFile}`) :
        colors.bgRed(`Test failed: ${testFile}`)
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
    console.log(colors.red('Error during test run of', testFile));
    console.log(colors.red(error.msg));
  });
}

function close() {
  phantomPool.close();
}


export default { getSrcTestMapping, runTest, close }
