// JSON Reporter for Jasmine 1.3.1

var __testResults__ = [];

jasmine.getEnv().addReporter({
  reportRunnerStarting: function () {

  },

  reportRunnerResults: function () {

  },

  reportSuiteResults: function () {

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
      testResult[passed ? 'passedExpectations' : 'failedExpectations'].push({
        actual: item.actual,
        expected: item.expected,
        matcherName: item.matcherName,
        message: item.message,
        passed: passed,
        stack: item.trace.toString()
      })
    }
    __testResults__.push(testResult);
  },

  log: function () {

  }
});
