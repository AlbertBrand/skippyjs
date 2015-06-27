import fs from 'fs-extra';
import path from 'path';
import phantom from 'phantom';
import compile from 'es6-template-strings/compile';
import resolveToString from 'es6-template-strings/resolve-to-string';
import crypto from 'crypto';
import colors from 'colors/safe';
import config from './config';
import server from './httpServer';


const NO_TEST = 'no-test';
const SCRIPT_TEMPLATE = compile('<script src="${src}"></script>', 'utf8');
const RUNNER_TEMPLATE = compile(fs.readFileSync(config.templatePath + 'runner.html', 'utf8'));

let coverageOut = {};
let diffResult = {};
let ph;

// boot phantom
let phantomBoot = new Promise((resolve, reject) => {
  phantom.create((newPhantom) => {
    ph = newPhantom;
    resolve();
  });
});


function getIndexFile(specFile) {
  let hash = crypto.createHash('md5').update(specFile).digest('hex');
  return 'index-' + hash + '.html';
}

function doCoverage(codeFiles, specFile) {
  console.log('doCoverage', codeFiles, specFile);

  let includes = [...codeFiles, specFile].map((src) => {
    return resolveToString(SCRIPT_TEMPLATE, { src: src });
  }).join('\n');
  let out = resolveToString(RUNNER_TEMPLATE, { includes: includes });

  let indexFile = getIndexFile(specFile);
  fs.writeFileSync(config.tmpPath + indexFile, out);

  return new Promise((resolve, reject) => {
    ph.createPage((page) => {
      page.open('http://localhost:' + config.httpServerPort + '/' + indexFile, () => {
        page.evaluate(() => {
          return __coverage__;
        }, (result) => {
          storeCoverage(result, specFile);
          resolve();
        });
      });
    });
  });
}

// store coverage
function storeCoverage(coverage, fileName) {
  coverageOut[getCoverageName(fileName)] = coverage;
  fs.writeFileSync(config.coveragePath + getCoverageName(fileName), JSON.stringify(coverage), 'utf8');
}

function getCoverageName(file) {
  return path.parse(file).name + '.coverage.json';
}

function initCoverage(instruFiles, specFiles) {
  phantomBoot.then(() => {
    // prepare run of instrumentation
    let promises = [doCoverage(instruFiles, NO_TEST)];
    for (let file of specFiles) {
      promises.push(doCoverage(instruFiles, file));
    }

    // run instrumentation for all specs
    Promise.all(promises).then(() => {
      console.log('Diffing');

      let noTestCoverage = coverageOut[getCoverageName(NO_TEST)];

      for (let specFile of specFiles) {
        let specCoverage = coverageOut[getCoverageName(specFile)];
        for (let codeFile in noTestCoverage) {
          let specBranch = specCoverage[codeFile].s;
          let noTestBranch = noTestCoverage[codeFile].s;
          for (let i in noTestBranch) {
            let diff = specBranch[i] - noTestBranch[i];
            if (diff != 0) {
              if (!diffResult[codeFile]) {
                diffResult[codeFile] = [];
              }
              diffResult[codeFile].push(specFile);
              break;
            }
          }
        }
      }

      console.log(diffResult);
    });
  });
}

function runSpec(specFile) {
  let indexFile = getIndexFile(specFile);
  ph.createPage((page) => {
    page.open('http://localhost:' + config.httpServerPort + '/' + indexFile, () => {
      page.evaluate(() => {
        return JSR._resultsCache;
      }, (result) => {
        let success = true;
        for (let string of result) {
          let it = JSON.parse(string);
          if(it.status === 'passed') {
            console.log(colors.green(it.description));
          } else {
            console.log(colors.red(it.description));
            success = false;
          }
        }
        console.log('Spec ', success ? colors.green(specFile) : colors.red(specFile));
      });
    });
  });
}

function runTest(file) {
  phantomBoot.then(() => {
    if (diffResult[file]) {
      console.log('code file, running specs: ', diffResult[file]);
      for(let specFile of diffResult[file]) {
        runSpec(specFile);
      }
    } else {
      console.log('spec file, running only this: ', file);
      runSpec(file);
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
