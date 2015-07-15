import http from 'http';
import serveStatic from 'serve-static';
import finalhandler from 'finalhandler';
import config from './config';


let httpServer;

// TODO serve only configured files
const generatedServe = serveStatic(config.generatedPath);
const staticServe = serveStatic(config.staticPath);
const rootServe = serveStatic('.');

function serve() {
  httpServer = http.createServer((req, res) => {
    generatedServe(req, res, () => {
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
