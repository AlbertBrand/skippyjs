// SkippyJS bridge for Jasmine 1.3.1

var __relatedFiles__ = [];
var __testResults__ = [];
var __done__ = false;

jasmine.getEnv().addReporter({
  stmtCoverage: null,

  reportRunnerStarting: function () {
    this.stmtCoverage = getStmtCoverage(__coverage__);
  },

  reportRunnerResults: function () {
    __done__ = true;
  },

  reportSuiteResults: function (suite) {
    if (suite.parentSuite !== null) {
      return;
    }
    var lastStmtCoverage = this.stmtCoverage;
    this.stmtCoverage = getStmtCoverage(__coverage__);
    var relatedFiles = getRelatedFiles(lastStmtCoverage, this.stmtCoverage);
    __relatedFiles__.push(relatedFiles);
  },

  reportSpecStarting: function () {
  },

  reportSpecResults: function (spec) {
    var testResult = {
      description: spec.description,
      status: spec.results().failedCount > 0 ? "failed" : "passed",
      failedExpectations: [],
      passedExpectations: []
    };
    var items = spec.results().getItems();
    for (var j in items) {
      var item = items[j],
        passed = item.passed();
      var expectation = {
        //actual: String(item.actual),
        //expected: item.expected,
        //matcherName: item.matcherName,
        //stack: String(item.trace),
        message: item.message,
        passed: passed
      };
      testResult[passed ? 'passedExpectations' : 'failedExpectations'].push(expectation);
    }
    __testResults__.push(testResult);
  },

  log: function () {
  }
});
