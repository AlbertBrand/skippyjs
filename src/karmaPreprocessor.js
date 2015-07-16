import di from 'di';
import fs from 'fs-extra';
import path from 'path';
import glob from 'glob-all';
import mkdirp from 'mkdirp';
import _ from 'lodash';
import config from './config';


// TODO return promise and wait for processing to be done
function process() {
  for (let pattern in config.preprocessors) {
    const info = config.preprocessors[pattern];
    let modules = [{
      args: ['value', {}],
      config: ['value', info.config],
      logger: ['value', {
        // TODO replace with own logger
        create: () => {
          return { error: _.noop, warn: _.noop, info: _.noop, debug: _.noop }
        }
      }],
      helper: ['value', {
        merge: () => {
          var args = Array.prototype.slice.call(arguments, 0);
          args.unshift({});
          return _.merge.apply({}, args);
        },
        _
      }]
    }];
    modules = modules.concat(info.preprocessor);

    let injector = new di.Injector(modules);
    let preprocess;
    try {
      preprocess = injector.get('preprocessor:' + info.name);
    } catch (e) {
      console.log(`Can't load '${info.name}':\n${e.stack}`);
    }

    let files = glob.sync(pattern);
    for (let file of files) {
      const buffer = fs.readFileSync(file);
      mkdirp.sync(config.generatedPath + path.parse(file).dir);
      const destPath = config.generatedPath + file;
      preprocess(buffer.toString(), {
        originalPath: file
      }, (processed) => {
        if (config.debug) {
          console.log('writing', destPath)
        }
        fs.writeFileSync(destPath, processed);
      });
    }
  }
}


export default { process }
