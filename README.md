init

 - configure srcFiles & testFiles
 - instrument all specs
 - boot http server
 - determine no test coverage
 - determine coverage per test
 - determine link between src and test

file watcher

 - if test: run single test
 - else src: instrument src and run linked tests
 - output test(s) result


TODO:

 - app crashes when js under test contains parse errors
 - parallelisation (createPage or phantom process?)
 - more fine-grained link between test 'it' block and src files
 - create API for file changes / test running
 - console.log & test output
 - srcFiles without instrumentation
 - remove dependence on test framework, configure your own
 - js-reporters integration
 

Linked file format:

    {
      'src/file1.js': [
        'src/file1.spec.js',
        'integration.spec.js'
      ],
      'src/file2.js: [
        'src/file2.spec.js',
        'integration.spec.js'
      ]
    }

