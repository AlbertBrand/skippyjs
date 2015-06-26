/* LIBRARIES */
import fs from 'fs-extra';
import path from 'path';
import phantom from 'phantom';
import compile from 'es6-template-strings/compile';
import resolveToString from 'es6-template-strings/resolve-to-string';
import crypto from 'crypto';

/* CUSTOM MODULES */
import { testSrcPath, tmpPath, coveragePath, templatePath, staticPath, port} from './config';
import server from './server';

// prepare html template
let scriptTemplate = compile('<script src="${src}"></script>', 'utf8');
let runnerTemplate = compile(fs.readFileSync(templatePath + 'runner.html', 'utf8'));

let coverageOut = {};

const NO_TEST = 'no-test.coverage.json';

export default function (instruFiles, specFiles) {
  phantom.create((ph) => {

    function doCoverage(srcFiles, dest) {
      let includes = srcFiles.map((src) => {
        return resolveToString(scriptTemplate, { src: src });
      }).join('\n');
      let out = resolveToString(runnerTemplate, { includes: includes });
      let hash = crypto.createHash('md5').update(out).digest('hex');

      let fileName = 'index-' + hash + '.html';
      fs.writeFileSync(tmpPath + fileName, out);

      return new Promise((resolve, reject) => {
        ph.createPage((page) => {
          page.open('http://localhost:' + port + '/' + fileName, () => {
            page.evaluate(() => {
              return __coverage__;
            }, (result) => {
              storeCoverage(result, dest);
              resolve();
            });
          });
        });
      });
    }

    // store coverage
    function storeCoverage(coverage, fileName) {
      coverageOut[fileName] = coverage;
      fs.writeFileSync(coveragePath + fileName, JSON.stringify(coverage), 'utf8');
    }

    function getCoverageName(file) {
      return path.parse(file).name + '.coverage.json';
    }

    // prepare run of instrumentation
    let promises = [
      doCoverage(instruFiles, NO_TEST)
    ];

    for (let file of specFiles) {
      promises.push(doCoverage([...instruFiles, file], getCoverageName(file)));
    }

    // run instrumentation for all specs
    Promise.all(promises).then(() => {
      console.log('Diffing');

      let diffResult = {};
      let noTestCoverage = coverageOut[NO_TEST];

      for (let specFile of specFiles) {
        let specCoverage = coverageOut[getCoverageName(specFile)];
        for (let codeFile in noTestCoverage) {
          let specBranch = specCoverage[codeFile].s;
          let noTestBranch = noTestCoverage[codeFile].s;
          for (let i in noTestBranch) {
            let diff = specBranch[i] - noTestBranch[i];
            if(diff != 0) {
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

      console.log('Closing phantom & server');
      ph.exit();
      server.close();
    });

  });
}
