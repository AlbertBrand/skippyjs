export let instrumentFiles = [
  'testsrc/**/*.js',
  '!testsrc/**/*.spec.js'
];

export let srcFiles = [
  ...instrumentFiles
];

export let testFiles = [
  'testsrc/**/*.spec.js'
];

export let staticFiles = [];

export let maxProcesses = 4;

export let debug = false;
