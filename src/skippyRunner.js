import fs from 'fs-extra';
import path from 'path';
import colors from 'colors/safe';
import _ from 'lodash';
import config from './config';
import runnerTemplate from './runnerTemplate';
import phantomPool from './phantomPool';


const NO_TEST = 'no-test';
let coverageOut = {};

function doRun(srcFiles, testFile) {
  return new Promise((resolve) => {
    let scriptFiles = [...srcFiles];
    if (testFile !== NO_TEST) {
      scriptFiles.push(testFile);
    }

    const runnerFileName = runnerTemplate.getRunnerFileName(testFile);
    runnerTemplate.createRunnerFile(scriptFiles, runnerFileName);

    console.log('Running', testFile);
    phantomPool.openPage('http://localhost:' + config.httpServerPort + '/' + runnerFileName, (page) => {
      page.evaluate(() => {
        //noinspection JSUnresolvedVariable
        return { coverage: __coverage__, testResults: JSR.results };
      }, resolve);
    });
  });
}

function getCoverage(srcFiles, testFile) {
  return doRun(srcFiles, testFile).then((result) => {
    console.log('Got coverage for', testFile);
    coverageOut[testFile] = result.coverage;
    const coverageName = path.parse(testFile).name + '.coverage.json';
    fs.writeFileSync(config.coveragePath + coverageName, JSON.stringify(result.coverage), 'utf8');
  });
}

function getSrcTestMapping(srcFiles, testFiles) {
  return new Promise((resolve) => {
    let promises = [getCoverage(srcFiles, NO_TEST)];
    for (let testFile of testFiles) {
      promises.push(getCoverage(srcFiles, testFile));
    }

    Promise.all(promises).then(() => {
      console.log('Diffing coverage reports...');

      let noTestCoverage = coverageOut[NO_TEST];
      let mapping = {};

      for (let testFile of testFiles) {
        let testCoverage = coverageOut[testFile];
        for (let srcFile in noTestCoverage) {
          let testStmtCov = testCoverage[srcFile].s;
          let noTestStmtCov = noTestCoverage[srcFile].s;
          for (let i in noTestStmtCov) {
            if (testStmtCov[i] != noTestStmtCov[i]) {
              if (!mapping[srcFile]) {
                mapping[srcFile] = [];
              }
              mapping[srcFile].push(testFile);
              break;
            }
          }
        }
      }

      console.log('Source files and their related tests:');
      console.log(mapping);
      resolve(mapping);
    });
  });
}

function runTest(srcFiles, testFile) {
  doRun(srcFiles, testFile).then((result) => {
    let success = true;
    for (let testResult of result.testResults) {
      if (testResult.status === 'passed') {
        console.log(colors.green(testResult.description));
      } else {
        console.log(colors.red(testResult.description));
        console.log('Failed expectations:');
        console.log(_.pluck(testResult.failedExpectations, 'message').join('\n'));
        success = false;
      }
    }
    console.log('Test', success ? 'succeeded: ' + colors.green(testFile) : 'failed: ' + colors.red(testFile));
  });
}

function close() {
  phantomPool.close();
}


export default { getSrcTestMapping, runTest, close }
