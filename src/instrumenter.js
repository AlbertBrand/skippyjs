'use strict';

import istanbul from 'istanbul';
import fs from 'fs-extra';
import path from 'path';
import phantom from 'phantom';
import http from 'http';
import finalhandler from 'finalhandler';
import serveStatic from 'serve-static';
import compile from 'es6-template-strings/compile';
import resolveToString from 'es6-template-strings/resolve-to-string';
import fileReader from './fileReader';
import crypto from 'crypto';
let {testFiles, codeFiles} = fileReader('testsrc');

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
let instruFiles = [];
for(let file of codeFiles) {
  let instrumentedName = path.parse(file).name + '.instrumented.js';
  let instrCode = instrumenter.instrumentSync(code, file);
  fs.writeFileSync(tmpPath + instrumentedName, instrCode);
  instruFiles.push(instrumentedName);
}
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
    var hash = crypto.createHash('md5').update(out).digest('hex');

    let fileName = 'index-' + hash + '.html';
    fs.writeFileSync(tmpPath + fileName, out);

    return new Promise((resolve, reject) => {
      ph.createPage((page) => {
        page.open('http://localhost:' + port + '/' + fileName, () => {
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
  let promises = [];
  promises.push(doCoverage(instruFiles, 'no-test.coverage.json'))

  for(let file of testFiles) {
    let coverageFileName = path.parse(file).name + '.coverage.json'
    promises.push(doCoverage([...instruFiles, file], coverageFileName));


  }

  Promise.all(promises).then(() => {

    console.log('Closing phantom & server');
    ph.exit();
    server.close();
  });

});
