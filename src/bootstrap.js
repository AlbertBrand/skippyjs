import fs from 'fs-extra';
import config from './config';


function recreateDir(dir) {
  if (fs.existsSync(dir)) {
    fs.removeSync(dir)
  }
  fs.mkdirSync(dir);
}

function cleanTmp() {
  recreateDir(config.tmpPath);
  recreateDir(config.coveragePath);
  recreateDir(config.generatedPath);
}


export default { cleanTmp }
