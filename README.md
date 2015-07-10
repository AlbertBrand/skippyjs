SkippyJS alpha
---

SkippyJS is an continuous test runner for JavaScript using PhantomJS.
It features:
 
 - parallel execution of tests using multiple Phantom processes
 - map test files on source files and only run relevant tests on source/test file change

Installation
---

 - Clone repo and run npm install
 - Install as dependency in other project. As the project is not released yet, use npm link.
 - Create a skippy config file, see skippyConfig.js for an example.
 - Run skippyJS:


    ./node_modules/skippyjs/bin/skippyjs mySkippyConfig.js

Implementation details
---

At init:

 - configure src files & test files
 - instrument all src files
 - boot http server
 - boot multiple phantom processes
 - determine no test coverage
 - determine coverage per test
 - determine link between src and test
 - start watching files

File watcher behavior:

 - if test file changes: run single test
 - else if src file changes: instrument src file and run linked tests
 - output test results


TODO:

 - more fine-grained link between test 'it' block and src files
 - create API for file changes / test running
 - console.log output of tests
 - add srcFiles without instrumentation
 - remove dependency on test framework, configure your own
 - js-reporters output
 - only show verbose log messages in debug mode
 - warn when src/testFiles are included that do not exist


DONE:

 - app no longer crashes when src or test files contain parse errors
 - parallelism using multiple phantom processes
 - show failed test run output

License
---

MIT
