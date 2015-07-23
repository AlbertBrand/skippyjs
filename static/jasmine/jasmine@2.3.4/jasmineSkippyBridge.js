// SkippyJS bridge for Jasmine 2.3.4

var __relatedFiles__ = [];
var __testResults__ = [];
var __done__ = false;

function isTopSuiteChild(suiteId) {
  var topSuiteChildren = jasmine.getEnv().topSuite().children;
  for (var i in topSuiteChildren) {
    if (topSuiteChildren[i].id === suiteId) {
      return true;
    }
  }
  return false;
}

jasmine.getEnv().addReporter({
  stmtCoverage: null,

  jasmineStarted: function () {
    this.stmtCoverage = getStmtCoverage(__coverage__);
  },

  jasmineDone: function () {
    __done__ = true;
  },

  suiteStarted: function () {
  },

  suiteDone: function (suiteResult) {
    if (!isTopSuiteChild(suiteResult.id)) {
      return;
    }
    var lastStmtCoverage = this.stmtCoverage;
    this.stmtCoverage = getStmtCoverage(__coverage__);
    var relatedFiles = getRelatedFiles(lastStmtCoverage, this.stmtCoverage);
    __relatedFiles__.push(relatedFiles);
  },

  specStarted: function () {
  },

  specDone: function (spec) {
    __testResults__.push(spec);
  }
});