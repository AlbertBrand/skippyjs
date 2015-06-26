'use strict';

let istanbul = require('istanbul'),
  fs = require('fs-extra'),
  path = require('path'),
  phantom = require('phantom'),
  http = require('http'),
  finalhandler = require('finalhandler'),
  serveStatic = require('serve-static'),
  compile = require('es6-template-strings/compile'),
  resolveToString = require('es6-template-strings/resolve-to-string');

let testSrcPath = 'testsrc/';
let tmpPath = '.tmp/';
let coveragePath = tmpPath + 'coverage/';
let templatePath = 'template/';
let staticPath = 'static/';

let srcFilePath = testSrcPath + 'file1.js';
let specFilePath = 'file1.spec.js';

// prepare html template
let scriptTemplate = compile('<script src="${src}"></script>', 'utf8');
let runnerTemplate = compile(fs.readFileSync(templatePath + 'runner.html', 'utf8'));

// cleanup
if (!fs.existsSync(tmpPath)) {
  fs.mkdirSync(tmpPath);
}
if (fs.existsSync(coveragePath)) {
  fs.removeSync(coveragePath)
}
fs.mkdirSync(coveragePath);

// run instrumentation
let code = fs.readFileSync(srcFilePath, 'utf8');
let instrumenter = new istanbul.Instrumenter();
let instrCode = instrumenter.instrumentSync(code, srcFilePath);
fs.writeFileSync(tmpPath + 'file1.instrumented.js', instrCode);

// run webserver
let port = 4999;
let tmpServe = serveStatic(tmpPath);
let staticServe = serveStatic(staticPath);
let testSrcServe = serveStatic(testSrcPath);
let server = http.createServer((req, res) => {
  tmpServe(req, res, () => {
    testSrcServe(req, res, () => {
      staticServe(req, res, finalhandler(req, res));
    });
  });
}).listen(port);

// run phantom
phantom.create((ph) => {

  function doCoverage(srcFiles, dest) {
    let includes = srcFiles.map((src) => {
      return resolveToString(scriptTemplate, { src: src });
    }).join('\n');
    let out = resolveToString(runnerTemplate, { includes: includes });
    fs.writeFileSync(tmpPath + 'index.html', out);

    return new Promise((resolve, reject) => {
      ph.createPage((page) => {
        page.open('http://localhost:' + port + '/index.html', () => {
          page.evaluate(function () {
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
    fs.writeFileSync(coveragePath + fileName, JSON.stringify(coverage), 'utf8');
  }

  // run once without spec
  doCoverage(['file1.instrumented.js'], 'no-test.coverage.json')
    .then(() => {
      // run for each spec
      doCoverage(['file1.instrumented.js', specFilePath], 'file1.spec.coverage.json')
        .then(() => {
          console.log('Closing phantom & server');
          ph.exit();
          server.close();
        });
    })

});
