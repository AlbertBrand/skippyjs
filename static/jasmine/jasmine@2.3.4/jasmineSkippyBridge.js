// SkippyJS bridge for Jasmine 2.3.4

function isTopSuiteChild(suiteId) {
  var topSuiteChildren = jasmine.getEnv().topSuite().children;
  for (var i in topSuiteChildren) {
    if (topSuiteChildren[i].id === suiteId) {
      return true;
    }
  }
  return false;
}

function cleanExpectations(expectations) {
  var cleaned = [];
  for (var i in expectations) {
    cleaned.push({
      message: expectations[i].message,
      passed: expectations[i].passed
    });
  }
  return cleaned;
}

function getTestResults(node) {
  var testResult = node.result,
    childResults = [];

  testResult.failedExpectations = cleanExpectations(testResult.failedExpectations);
  testResult.passedExpectations = cleanExpectations(testResult.passedExpectations);

  for (var i in node.children) {
    var child = node.children[i];
    childResults.push(getTestResults(child));
  }
  if (childResults.length) {
    testResult.children = childResults;
  }

  return testResult;
}

jasmine.getEnv().addReporter({
  stmtCoverage: null,
  relatedFiles: [],

  jasmineStarted: function () {
    this.stmtCoverage = getStmtCoverage(__coverage__);
  },

  jasmineDone: function () {
    doCallback({
      relatedFiles: this.relatedFiles,
      testResults: getTestResults(jasmine.getEnv().topSuite()),
      coverage: __config__.storeCoverage ? __coverage__ : null
    });
  },

  suiteStarted: function () {
  },

  suiteDone: function (suiteResult) {
    if (!isTopSuiteChild(suiteResult.id)) {
      return;
    }

    var lastStmtCoverage = this.stmtCoverage;
    this.stmtCoverage = getStmtCoverage(__coverage__);
    this.relatedFiles.push(getRelatedFiles(lastStmtCoverage, this.stmtCoverage));
  },

  specStarted: function () {
  },

  specDone: function () {
  }
});
