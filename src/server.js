/* LIBRARIES */
import http from 'http';
import serveStatic from 'serve-static';
import finalhandler from 'finalhandler';

/* CUSTOM MODULES */
import {tmpPath, staticPath, testSrcPath} from './config';

let httpServer;

export default {
    serve: function (port) {
        // run webserver
        let tmpServe = serveStatic(tmpPath);
        let staticServe = serveStatic(staticPath);
        let testSrcServe = serveStatic(testSrcPath);
        httpServer = http.createServer((req, res) => {
            tmpServe(req, res, () => {
                testSrcServe(req, res, () => {
                    staticServe(req, res, finalhandler(req, res));
                });
            });
        }).listen(port);
    },
    close: function() {
        httpServer.close();
    }
}