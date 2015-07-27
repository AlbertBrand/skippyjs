import colors from 'colors';
import config from './config'; // make sure config is imported first
import bootstrap from './bootstrap';
import instrumenter from './instrumenter';
import server from './httpServer';
import runner from './skippyRunner';
import phantomPool from './phantomPool';
import fileWatcher from './fileWatcher';
import karmaPreprocessor from './karmaPreprocessor'

console.log(colors.bgMagenta.white('╔═╗┬┌─┬┌─┐┌─┐┬ ┬╦╔═╗'));
console.log(colors.bgMagenta.white('╚═╗├┴┐│├─┘├─┘└┬┘║╚═╗'));
console.log(colors.bgMagenta.white('╚═╝┴ ┴┴┴  ┴   ┴╚╝╚═╝'));
console.log('')
console.log(colors.bgMagenta.white('--------'));

console.time('SkippyJS ready in');

phantomPool.boot();

bootstrap.cleanTmp();

karmaPreprocessor.process();

instrumenter.writeInstrumented([...config.instrumentFiles, ...config.testFiles]);

server.serve();

runner.getSrcTestRelation().then((relatedFiles) => {
  fileWatcher.start(relatedFiles);
  console.timeEnd('SkippyJS ready in');
});
