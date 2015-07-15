import colors from 'colors';
import config from './config'; // make sure config is imported first
import bootstrap from './bootstrap';
import instrumenter from './instrumenter';
import server from './httpServer';
import runner from './skippyRunner';
import phantomPool from './phantomPool';
import fileWatcher from './fileWatcher';


console.log(colors.bgMagenta.white('SkippyJS'));
console.log(colors.bgMagenta.white('--------'));

phantomPool.boot();

bootstrap.cleanTmp();

instrumenter.writeInstrumented(config.instrumentFiles);

server.serve();

runner.getSrcTestMapping().then((mapping) => {
  fileWatcher.start(mapping);
});
