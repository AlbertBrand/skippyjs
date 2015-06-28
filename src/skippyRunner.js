import fs from 'fs-extra';
import path from 'path';
import phantom from 'phantom';
import colors from 'colors/safe';
import config from './config';
import runnerTemplate from './runnerTemplate';
import instrumenter from './instrumenter';


const NO_TEST = 'no-test';
let coverageOut = {};
let ph;

// boot phantom
let phantomBoot = new Promise((resolve) => {
  phantom.create((phantomInstance) => {
    ph = phantomInstance;
    resolve();
  });
});

function runPage(pageName, evalFn) {
  return new Promise((resolve) => {
    ph.createPage((page) => {
      page.open('http://localhost:' + config.httpServerPort + '/' + pageName, () => {
        page.evaluate(evalFn, resolve);
      });
    });
  });
}

function doCoverage(srcFiles, testFile) {
  console.log('Get coverage for', testFile);

  let scriptFiles = [...srcFiles];
  if (testFile !== NO_TEST) {
    scriptFiles.push(testFile);
  }

  const runnerFileName = runnerTemplate.getRunnerFileName(testFile);
  runnerTemplate.createRunnerFile(scriptFiles, runnerFileName);

  return runPage(runnerFileName, () => {
    //noinspection JSUnresolvedVariable
    return __coverage__;
  }).then((coverage) => {
    coverageOut[testFile] = coverage;
    const coverageName = path.parse(testFile).name + '.coverage.json';
    fs.writeFileSync(config.coveragePath + coverageName, JSON.stringify(coverage), 'utf8');
  });
}

function initCoverage(srcFiles, testFiles) {
  return new Promise((resolve) => {
    phantomBoot.then(() => {
      let promises = [doCoverage(srcFiles, NO_TEST)];
      for (let testFile of testFiles) {
        promises.push(doCoverage(srcFiles, testFile));
      }

      Promise.all(promises).then(() => {
        console.log('Diffing coverage reports...');

        let noTestCoverage = coverageOut[NO_TEST];
        let diffResult = {};

        for (let testFile of testFiles) {
          let testCoverage = coverageOut[testFile];
          for (let srcFile in noTestCoverage) {
            let testBranchCov = testCoverage[srcFile].s;
            let noTestBranchCov = noTestCoverage[srcFile].s;
            for (let i in noTestBranchCov) {
              if (testBranchCov[i] != noTestBranchCov[i]) {
                if (!diffResult[srcFile]) {
                  diffResult[srcFile] = [];
                }
                diffResult[srcFile].push(testFile);
                break;
              }
            }
          }
        }

        console.log('Source files and their related tests:');
        console.log(diffResult);
        resolve(diffResult);
      });
    });
  });
}

function runTest(testFile) {
  phantomBoot.then(() => {
    const runnerFileName = runnerTemplate.getRunnerFileName(testFile);

    runPage(runnerFileName, () => {
      return JSR.results;
    }).then((results) => {
      let success = true;
      for (let result of results) {
        if (result.status === 'passed') {
          console.log(colors.green(result.description));
        } else {
          console.log(colors.red(result.description));
          success = false;
        }
      }
      console.log('Test', success ? 'succeeded: ' + colors.green(testFile) : 'failed: ' + colors.red(testFile));
    });
  });
}

function close() {
  phantomBoot.then(() => {
    console.log('Closing phantom');
    ph.exit();
  });
}


export default { initCoverage, runTest, close }
