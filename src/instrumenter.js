var istanbul = require('istanbul'),
  fs = require('fs-extra'),
  path = require('path'),
  phantom = require('phantom'),
  http = require('http'),
  finalhandler = require('finalhandler'),
  serveStatic = require('serve-static'),
  compile = require('es6-template-strings/compile'),
  resolveToString = require('es6-template-strings/resolve-to-string');

var testSrcPath = 'testsrc/';
var tmpPath = '.tmp/';
var coveragePath = tmpPath + 'coverage/';
var templatePath = 'template/';
var staticPath = 'static/';

var srcFilePath = testSrcPath + 'file1.js';
var specFilePath = 'file1.spec.js';

// prepare html template
var scriptTemplate = compile('<script src="${src}"></script>', 'utf8');
var runnerTemplate = compile(fs.readFileSync(templatePath + 'runner.html', 'utf8'));

// cleanup
if (!fs.existsSync(tmpPath)) {
  fs.mkdirSync(tmpPath);
}
if (fs.existsSync(coveragePath)) {
  fs.removeSync(coveragePath)
}
fs.mkdirSync(coveragePath);

// run instrumentation
var code = fs.readFileSync(srcFilePath, 'utf8');
var instrumenter = new istanbul.Instrumenter();
var instrCode = instrumenter.instrumentSync(code, srcFilePath);
fs.writeFileSync(tmpPath + 'file1.instrumented.js', instrCode);

// run webserver
var port = 4999;
var tmpServe = serveStatic(tmpPath);
var staticServe = serveStatic(staticPath);
var testSrcServe = serveStatic(testSrcPath);
var server = http.createServer(function (req, res) {
  tmpServe(req, res, function() {
    testSrcServe(req, res, function() {
      staticServe(req, res, finalhandler(req, res));
    });
  });
}).listen(port);

// run phantom
phantom.create(function (ph) {

  function doCoverage(srcFiles, dest) {
    var includes = srcFiles.map(function (src) {
      return resolveToString(scriptTemplate, { src: src });
    }).join('\n');
    var out = resolveToString(runnerTemplate, { includes: includes });
    fs.writeFileSync(tmpPath + 'index.html', out);

    return new Promise(function (resolve, reject) {
      ph.createPage(function (page) {
        page.open('http://localhost:' + port + '/index.html', function () {
          page.evaluate(function () {
            return __coverage__;
          }, function (result) {
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
    .then(function () {
      // run for each spec
      doCoverage(['file1.instrumented.js', specFilePath], 'file1.spec.coverage.json')
        .then(function () {
          console.log('Closing phantom & server');
          ph.exit();
          server.close();
        });
    })

});
