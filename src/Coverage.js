/* LIBRARIES */
import fs from 'fs-extra';
import path from 'path';
import phantom from 'phantom';
import compile from 'es6-template-strings/compile';
import resolveToString from 'es6-template-strings/resolve-to-string';
import crypto from 'crypto';
import colors from 'colors/safe';
/* CUSTOM MODULES */
import { testSrcPath, tmpPath, coveragePath, templatePath, staticPath, port} from './config';
//import server from './server';

const NO_TEST = 'no-test';

// prepare html template
let scriptTemplate = compile('<script src="${src}"></script>', 'utf8');
let runnerTemplate = compile(fs.readFileSync(templatePath + 'runner.html', 'utf8'));

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
    return resolveToString(scriptTemplate, { src: src });
  }).join('\n');
  let out = resolveToString(runnerTemplate, { includes: includes });

  let indexFile = getIndexFile(specFile);
  fs.writeFileSync(tmpPath + indexFile, out);

  return new Promise((resolve, reject) => {
    ph.createPage((page) => {
      page.open('http://localhost:' + port + '/' + indexFile, () => {
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
  fs.writeFileSync(coveragePath + getCoverageName(fileName), JSON.stringify(coverage), 'utf8');
}

function getCoverageName(file) {
  return path.parse(file).name + '.coverage.json';
}

export function initCoverage(instruFiles, specFiles) {
  phantomBoot.then(() => {
    console.log(colors.bgMagenta.white('SkippyJS booted!'));

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
    page.open('http://localhost:' + port + '/' + indexFile, () => {
      page.evaluate(() => {
        return JSR._resultsCache;
      }, (result) => {
        var success = true;
        for (let string of result) {
          let it = JSON.parse(string);
          if(it.status === 'passed') {
            console.log(colors.green(it.description));
          } else {
            console.log(colors.red(it.description));
            success = false;
          }
        }
        if(success)
          console.log('Spec ', colors.green(specFile));
        else
          console.log('Spec ', colors.red(specFile));
      });
    });
  });
}

export function runTest(file) {
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

export function closeServer() {
  phantomBoot.then(() => {
    console.log('Closing phantom & server');
    ph.exit();
    server.close();
  });
}
