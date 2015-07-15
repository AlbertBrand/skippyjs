// JSON Reporter for Jasmine

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
