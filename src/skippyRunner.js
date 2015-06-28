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


function storeCoverage(coverage, fileName) {
  coverageOut[getCoverageName(fileName)] = coverage;
  fs.writeFileSync(config.coveragePath + getCoverageName(fileName), JSON.stringify(coverage), 'utf8');
}

function getCoverageName(file) {
  return path.parse(file).name + '.coverage.json';
}

function doCoverage(srcFiles, testFile) {
  console.log('Get coverage for', testFile);

  let indexFile = runnerTemplate.createIndexFile(srcFiles, testFile);
  console.log(indexFile);

  return new Promise((resolve) => {
    ph.createPage((page) => {
      page.open('http://localhost:' + config.httpServerPort + '/' + indexFile, () => {
        page.evaluate(() => {
          //noinspection JSUnresolvedVariable
          return __coverage__;
        }, (result) => {
          storeCoverage(result, testFile);
          resolve();
        });
      });
    });
  });
}

function initCoverage(srcFiles, testFiles) {
  phantomBoot.then(() => {
    let promises = [doCoverage(srcFiles, NO_TEST)];
    for (let file of testFiles) {
      promises.push(doCoverage(srcFiles, file));
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

      console.log('Source file and their related tests:');
      console.log(diffResult);
    });
  });
}

function runTestInPhantom(testFile) {
  let indexFile = runnerTemplate.getIndexFileName(testFile);
  ph.createPage((page) => {
    page.open('http://localhost:' + config.httpServerPort + '/' + indexFile, () => {
      page.evaluate(() => {
        return JSR.results;
      }, (results) => {
        let success = true;
        for (let result of results) {
          if (result.status === 'passed') {
            console.log(colors.green(result.description));
          } else {
            console.log(colors.red(result.description));
            success = false;
          }
        }
        console.log('Test ', success ? colors.green(testFile) : colors.red(testFile));
      });
    });
  });
}

function runTest(file) {
  phantomBoot.then(() => {
    if (diffResult[file]) {
      console.log('Source file changed, running related tests: ', diffResult[file]);
      for (let testFile of diffResult[file]) {
        runTestInPhantom(testFile);
      }
    } else {
      console.log('Test file changed, running only this: ', file);
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