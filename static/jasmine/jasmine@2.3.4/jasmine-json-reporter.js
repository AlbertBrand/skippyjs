// JSON Reporter for Jasmine 2.3.4

var __testResults__ = [];

jasmine.getEnv().addReporter({
  suiteStarted: function () {

  },

  suiteDone: function () {

  },

  specStarted: function () {

  },

  specDone: function (spec) {
    __testResults__.push(spec);
  },

  jasmineDone: function () {

  }
});
