export let testFramework = 'jasmine@2.3.4';

export let instrumentFiles = [
  'src/**/*.js',
  '!src/**/*.spec.js'
];

export let srcFiles = [
  ...instrumentFiles
];

export let testFiles = [
  'src/**/*.spec.js'
];

export let staticFiles = [];

export let maxProcesses = 4;

export let debug = false;
