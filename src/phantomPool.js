import phantom from 'phantom';
import Queue from 'promise-queue';
import _ from 'lodash';
import path from 'path';
import colors from 'colors';
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
      if (config.verbose) {
        console.log(`${config.maxProcesses} instances of Phantom started`);
      }
    });
}

function openPage(pageUrl, resultFn, errorFn) {
  booted.then(() => {
    queue.add(() => {
      return new Promise((resolve) => {
        const processIdx = _.findIndex(processes, { active: false }),
          process = processes[processIdx];
        let finished = false;

        function start() {
          if (config.verbose) {
            console.log(`[${processIdx}] running page`);
            console.time(`[${processIdx}] finish page`);
          }
          process.active = true;
        }

        function finish() {
          if (!finished) {
            if (config.verbose) {
              console.timeEnd(`[${processIdx}] finish page`);
            }
            process.active = false;
            finished = true;
            resolve();
          }
        }

        start();

        process.instance.createPage((page) => {
          page.set('onCallback', (result) => {
            resultFn(result);
            finish();
          });
          page.set('onResourceError', ({errorCode, url, errorString}) => {
            if (errorCode >= 100) {
              console.log(colors.yellow(`Warning: [${errorCode}] ${errorString}`));
            } else {
              console.log(colors.gray(`Info: [${errorCode}] ${url} ${errorString}`));
            }
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
