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
      (page, processIdx) => {
        console.time('page.evaluate process ' + processIdx);
        page.evaluate(() => {
          //noinspection JSUnresolvedVariable
          let coverage = __coverage__, stmtCoverage = {};
          for (let file in coverage) {
            let statements = [];
            for (let key in coverage[file].s) {
              statements.push(coverage[file].s[key]);
            }
            stmtCoverage[file] = statements.join('|');
          }
          return { stmtCoverage: stmtCoverage, testResults: __testResults__ };
        }, (result) => {
          console.timeEnd('page.evaluate process ' + processIdx);
          resolve({ testFile, stmtCoverage: result.stmtCoverage, testResults: result.testResults });
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
    console.time('getSrcTestMapping');
    let promises = [getCoverage(NO_TEST), ..._.map(config.testFiles, (testFile) => {
      return getCoverage(testFile);
    })];

    Promise.all(promises).then((result) => {
      if (config.debug) {
        console.log('Diffing coverage reports...');
        console.time('diff');
      }

      let noTestCoverage = _.find(result, 'testFile', NO_TEST).stmtCoverage;
      let mapping = {};

      for (let testFile of config.testFiles) {
        let testCoverage = _.find(result, 'testFile', testFile).stmtCoverage;
        for (let instrumentedFile in noTestCoverage) {
          let testStmtCov = testCoverage[instrumentedFile];
          let noTestStmtCov = noTestCoverage[instrumentedFile];
          if (testStmtCov !== noTestStmtCov) {
            if (!mapping[instrumentedFile]) {
              mapping[instrumentedFile] = [];
            }
            mapping[instrumentedFile].push(testFile);
          }
        }
      }

      if (config.debug) {
        console.log('Source files and their related tests:');
        console.log(mapping);
        console.timeEnd('diff');
      }

      console.timeEnd('getSrcTestMapping');
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
