// JSON Reporter for Jasmine
// --------------------

var JSR = {}

JSR.suiteStarted = function (suite) {

}

JSR.suiteDone = function (suite) {

}

JSR.specStarted = function (spec) {

}

JSR.specDone = function (spec) {
  this._resultsCache.push(JSON.stringify(spec, null, 2))
}

JSR.jasmineDone = function () {

}

JSR._resultsCache = []

jasmine.getEnv().addReporter(JSR);
