import phantom from 'phantom';


const MAX_PROCESSES = 4;
let phantomProcesses = [];
let phantomBooted;

function createPhantomProcess() {
  return new Promise((resolve) => {
    phantom.create((phantomInstance) => {
      phantomProcesses.push(phantomInstance);
      resolve();
    });
  });
}

function boot() {
  phantomBooted = new Promise((resolve) => {
    let promises = [];
    for (let i = 0; i < MAX_PROCESSES; i++) {
      promises.push(createPhantomProcess());
    }
    Promise.all(promises).then(() => {
      console.log('Phantom booted');
      resolve();
    });
  });
}

function openPage(pageUrl, openFn) {
  phantomBooted.then(() => {
    // TODO select free phantom process, use pool
    phantomProcesses[0].createPage((page) => {
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
        if(resourceCount === 0) {
          openFn(page);
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
}

function close() {
  phantomProcesses.each((ph) => {
    ph.exit();
  })
}


export default { boot, openPage, close }
