import phantom from 'phantom';
import Queue from 'promise-queue';
import _ from 'lodash';


const MAX_PROCESSES = 8;
const processes = [];
let booted;
let queue = new Queue(MAX_PROCESSES, Infinity);

function createPhantomProcess() {
  return new Promise((resolve) => {
    phantom.create((instance) => {
      processes.push({
        instance: instance,
        active: false
      });
      resolve();
    });
  });
}

function boot() {
  let promises = _.times(MAX_PROCESSES, () => {
    return createPhantomProcess();
  });
  booted = Promise.all(promises)
    .then(() => {
      console.log('Phantom booted');
    });
}

function openPage(pageUrl, openFn) {
  booted.then(() => {
    queue.add(() => {
      return new Promise((resolve) => {
        let processIdx = _.findIndex(processes, { active: false });
        console.log('Running page with process', processIdx);
        processes[processIdx].active = true;
        processes[processIdx].instance.createPage((page) => {
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
              console.log('Finished running page with process', processIdx);
              processes[processIdx].active = false;
              resolve();
            }
          });
          page.set('onResourceError', (resourceError) => {
            console.log('Unable to load resource', resourceError.url);
            //noinspection JSUnresolvedVariable
            console.log('Error code: ' + resourceError.errorCode + '. Description: ' + resourceError.errorString);
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
