import fs from 'fs-extra';
import path from 'path';
import phantom from 'phantom';
import colors from 'colors/safe';
import config from './config';
import server from './httpServer';
import runnerTemplate from './runnerTemplate';


const NO_TEST = 'no-test';

let coverageOut = {};
let diffResult = {};
let ph;

// boot phantom
let phantomBoot = new Promise((resolve) => {
  phantom.create((newPhantom) => {
    ph = newPhantom;
    resolve();
  });
});


function getCoverageName(file) {
  return path.parse(file).name + '.coverage.json';
}

function runPage(indexFileName, evalFn) {
  return new Promise((resolve) => {
    ph.createPage((page) => {
      page.open('http://localhost:' + config.httpServerPort + '/' + indexFileName, () => {
        page.evaluate(evalFn, resolve);
      });
    });
  });
}

function doCoverage(srcFiles, testFile) {
  console.log('Get coverage for', testFile);

  const indexFile = runnerTemplate.createIndexFile(srcFiles, testFile);

  return runPage(indexFile, () => {
    //noinspection JSUnresolvedVariable
    return __coverage__;
  }).then((coverage) => {
    const coverageName = getCoverageName(testFile);
    coverageOut[coverageName] = coverage;
    fs.writeFileSync(config.coveragePath + coverageName, JSON.stringify(coverage), 'utf8');
  });
}

function initCoverage(srcFiles, testFiles) {
  phantomBoot.then(() => {
    let promises = [doCoverage(srcFiles, NO_TEST)];
    for (let testFile of testFiles) {
      promises.push(doCoverage(srcFiles, testFile));
    }

    Promise.all(promises).then(() => {
      console.log('Diffing coverage reports...');

      let noTestCoverage = coverageOut[getCoverageName(NO_TEST)];

      for (let testFile of testFiles) {
        let testCoverage = coverageOut[getCoverageName(testFile)];
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
    });
  });
}

function runTestInPhantom(testFile) {
  const indexFileName = runnerTemplate.getIndexFileName(testFile);

  runPage(indexFileName, () => {
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
}

function runTest(file) {
  phantomBoot.then(() => {
    if (diffResult[file]) {
      console.log('Source file changed, run related tests:', diffResult[file]);
      for (let testFile of diffResult[file]) {
        runTestInPhantom(testFile);
      }
    } else {
      console.log('Test file changed, instrument and run:', file);
      runTestInPhantom(file);
    }
  });
}

function closeServer() {
  phantomBoot.then(() => {
    console.log('Closing phantom & server');
    ph.exit();
    server.close();
  });
}


export default { initCoverage, runTest, closeServer }
