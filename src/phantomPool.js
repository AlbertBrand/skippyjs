import phantom from 'phantom';
import Queue from 'promise-queue';
import _ from 'lodash';
import path from 'path';
import config from './config';


let processes;
let booted;
let queue;

function createPhantomProcess() {
  return new Promise((resolve) => {
    phantom.create({
      binary: path.resolve(__dirname, '../node_modules/phantomjs/bin/phantomjs')
    }, (instance) => {
      resolve({
        instance: instance,
        active: false
      });
    });
  });
}

function boot() {
  queue = new Queue(config.maxProcesses, Infinity);
  booted = Promise.all(_.times(config.maxProcesses, () => {
    return createPhantomProcess();
  }))
    .then((result) => {
      processes = result;
      if (config.debug) {
        console.log(`${config.maxProcesses} instances of Phantom started`);
      }
    });
}

function openPage(pageUrl, openFn, errorFn) {
  booted.then(() => {
    queue.add(() => {
      return new Promise((resolve) => {
        let processIdx = _.findIndex(processes, { active: false }),
          process = processes[processIdx],
          finished = false;

        function start() {
          if (config.debug) {
            console.log('Running page with process', processIdx);
            console.time('run' + processIdx);
          }
          process.active = true;
        }

        function finish() {
          if (!finished) {
            if (config.debug) {
              console.log('Finishing page with process', processIdx);
              console.timeEnd('run' + processIdx);
            }
            process.active = false;
            finished = true;
            resolve();
          }
        }

        start();

        process.instance.createPage((page) => {
          let resourceCount = 0;

          page.set('onResourceRequested', (res) => {
            if (!res.url.endsWith('.js')) {
              return;
            }
            resourceCount++;
          });
          page.set('onResourceReceived', (res) => {
            if (!res.url.endsWith('.js') || res.stage != 'end') {
              return;
            }
            resourceCount--;
            if (resourceCount === 0) {
              openFn(page);
              finish();
            }
          });
          page.set('onResourceError', (resourceError) => {
            console.log('Unable to load resource', resourceError.url);
            //noinspection JSUnresolvedVariable
            console.log(`Error code: ${resourceError.errorCode}. Description: ${resourceError.errorString}`);
          });
          page.set('onError', (msg) => {
            errorFn({ msg });
            finish();
          });

          page.open(pageUrl);
        });
      });
    });
  });
}

function close() {
  processes.each((ph) => {
    ph.exit();
  })
}


export default { boot, openPage, close }
