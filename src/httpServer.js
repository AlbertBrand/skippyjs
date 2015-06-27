/* LIBRARIES */
import http from 'http';
import serveStatic from 'serve-static';
import finalhandler from 'finalhandler';

/* CUSTOM MODULES */
import {tmpPath, staticPath, testSrcPath, port} from './config';


let httpServer;
let tmpServe = serveStatic(tmpPath);
let staticServe = serveStatic(staticPath);
let rootServe = serveStatic('.');


function serve() {
  httpServer = http.createServer((req, res) => {
    tmpServe(req, res, () => {
      staticServe(req, res, () => {
        rootServe(req, res, finalhandler(req, res));
      });
    });
  }).listen(port);
}

function close() {
  httpServer.close();
}


export default { serve, close }
