# SkippyJS alpha - the faster test runner

SkippyJS is an continuous test runner for JavaScript using PhantomJS.
It features:
 
  - parallel execution of tests using multiple Phantom processes
  - map test files on source files and only run relevant tests on source/test file change
  - Karma preprocessor support

## Installation

Install skippyjs:

  
    npm install skippyjs --saveDev


Create a skippy config file, see skippyConfig.js for an example.

Run skippyJS:


    ./node_modules/.bin/skippyjs mySkippyConfig.js


The following options are supported:


    -h, --help            output usage information
    -V, --version         output the version number
    -r, --run-once        only perform one test run, do not watch file changes
    -s, --store-coverage  store coverage JSON after determining related files
    --verbose             verbose output


## Configuration

The skippy config file can be written with ES6 (ES2015) or ES5 syntax, ES6 is preferred.
  
    
    // Select the test framework your project uses. 
    // Only jasmine@1.3.1 and jasmine@2.3.4 is supported right now.
    export let testFramework = 'jasmine@2.3.4';

    // Specify which files should be instrumented to determine the relation between src and test. 
    // Files that normally should not be instrumented are libraries and configuration.
    // You can use the glob-all syntax. 
    export let instrumentFiles = [
      'src/**/*.js',
      '!src/**/*.spec.js'
    ];
    
    // Specify all the src files that are needed to boot your application. Note that order is
    // important. You can use the spread operator to combine the instrumented files in this array.
    export let srcFiles = [
      ...instrumentFiles
    ];
    
    // Specify the files containing tests. 
    export let testFiles = [
      'src/**/*.spec.js'
    ];
    
    // Unsupported yet.
    export let staticFiles = [];
    
    // Override the number of Phantom processes used to run tests. Default is 8. 
    export let maxProcesses = 4;

    // Optionally define preprocessors for your src files. 
    // See 'Preprocessor setup' for more details.
    export let preprocessors = {};
    
    // Override the temp path for storing processed files and coverage. Defaults to
    // <app root>/node_modules/skippyjs/.tmp
    export let tmpPath = '.tmp/';

    // Override the port for the HTTP server that hosts files for Phantom. Defaults to 3000.
    export let httpServerPort = 3001;

    // Only perform one test run. Exists with status code 1 if any test failed. Can also be
    // set with --run-once flag. Defaults to false.
    export let runOnce = true;

    // Store the JS coverage after related files have been determined. It causes a 
    // slight perf hit as retrieving it from Phantom is slow. Can also be set with 
    // --store-coverage flag. Default is false.
    export let storeCoverage = true;

    // Enable more verbose output. Turning it on may cause some degraded perf. Can also be
    // set with --verbose flag. Default is false.
    export let verbose = true;


## Example

  - Go to ./example
  - Run skippyJS:
  
 
    ../bin/skippyjs skippyConfig.js


## Implementation details

### Determining relation

To determine the relation between a src and test file, the following algorithm is used:

  - Determine the statement coverage of instrumented files up to just before the run of a test file.
  - Run the test and determine the new statement coverage.
  - Compare coverage: check for each file if any statements have been run.
  - Any src file covered by the run of the test file is determined to be related.
 
There are many cases where this relation between tests does not hold. But in practice it can be sufficient. 

### Application init:

  - configure src files & test files
  - instrument all src files
  - boot http server
  - boot multiple phantom processes
  - preprocess files
  - determine relation between src and test
  - start watching files

### File watcher behavior:

  - if test file changes: instrument and run single test
  - else if instrumented src file changes: instrument src file and run related tests
  - else if non-instrumented src changes: nothing yet, maybe determine relation between src and test again?
  - finally: output test results

## Preprocessor setup

First install your favorite Karma preprocessor using npm, for instance:

    npm install --save karma-coffee-preprocessor
    
Then, setup the preprocessor in your config:

    // ... other exports

    import ngHtml2jsPreprocessor from 'karma-ng-html2js-preprocessor';
    import coffeePreprocessor from 'karma-coffee-preprocessor';

    export let preprocessors = {
      '**/*.html': ngHtml2jsPreprocessor, // shorthand, pick first preprocessor from imported object
      '**/*.coffee': { // full syntax
        name: 'coffee', // optional alternative preprocessor name from imported object
        preprocessor: coffeePreprocessor,
        config: {
          // optional configuration normally specified in karma config
          coffeePreprocessor: {
            // example, see preprocessor docs for details
            transformPath: (path) => { return path; }
          }
        }
      }
    };

    
Make sure to include the preprocessed files in your src files:


    export srcFiles = [
      '**/*.html',
      '**/*.coffee',
      // ... etc
    ];


## TODO

  - more fine-grained link between test 'it' block and src files
  - create REST API for file changes / test running
  - console.log output of tests
  - remove dependency on test framework, configure your own
  - js-reporters output
  - improve console/file logging
  - warn when src/testFiles are included that do not exist
  - preprocess instrumented files


## License

MIT
