import http from 'http';
import serveStatic from 'serve-static';
import finalhandler from 'finalhandler';
import config from './config';


let httpServer;
let tmpServe = serveStatic(config.tmpPath);
let staticServe = serveStatic(config.staticPath);
let rootServe = serveStatic('.');

function serve() {
  httpServer = http.createServer((req, res) => {
    tmpServe(req, res, () => {
      staticServe(req, res, () => {
        rootServe(req, res, finalhandler(req, res));
      });
    });
  }).listen(config.httpServerPort);
}

function close() {
  httpServer.close();
}


export default { serve, close }
