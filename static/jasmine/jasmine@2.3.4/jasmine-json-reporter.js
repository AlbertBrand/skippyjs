// JSON Reporter for Jasmine 2.3.4

var __relatedFiles__ = [];
var __testResults__ = [];

jasmine.getEnv().addReporter({
  stmtCoverage: null,

  jasmineStarted: function () {
    this.stmtCoverage = getStmtCoverage(__coverage__);
  },

  jasmineDone: function () {
  },

  suiteStarted: function () {
  },

  suiteDone: function () {
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
