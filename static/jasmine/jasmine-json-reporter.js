// JSON Reporter for Jasmine

var JSR = {
  results: [],

  suiteStarted: function () {

  },

  suiteDone: function () {

  },

  specStarted: function () {

  },

  specDone: function (spec) {
    this.results.push(spec);
  },

  jasmineDone: function () {

  }
};

jasmine.getEnv().addReporter(JSR);
