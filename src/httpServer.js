import http from 'http';
import st from 'st';
import _ from 'lodash';
import config from './config';


let httpServer;

const generatedServe = st({ path: config.generatedPath, url: '/', dot: true, passthrough: true, cache: false });
const staticServe = st({ path: config.staticPath, url: '/', dot: true, passthrough: true });

// TODO serve only configured files
const rootServe = st({ path: '.', url: '/', dot: true, cache: false });

function serve() {
  httpServer = http.createServer((req, res) => {
    if (req.url === '/config.js') {
      res.end('var __config__ = ' + JSON.stringify(config) + ';');
      return;
    }
    let isHandled;
    _.find(config.staticFiles, (staticFileConfig) => {
      const staticFileServe = st(staticFileConfig);
      isHandled = staticFileServe(req, res);
      return isHandled;
    });
    if (!isHandled) {
      generatedServe(req, res, () => {
        staticServe(req, res, () => {
          rootServe(req, res);
        });
      });
    }
  }).listen(config.httpServerPort);
}

function close() {
  httpServer.close();
}


export default { serve, close }
