import istanbul from 'istanbul';
import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import config from './config';


function writeInstrumented(filePaths) {
  let instrumenter = new istanbul.Instrumenter();
  for (let filePath of filePaths) {
    let code = fs.readFileSync(filePath, 'utf8');
    let instrumentedCode = instrumenter.instrumentSync(code, filePath);
    mkdirp.sync(config.generatedPath + path.parse(filePath).dir);
    fs.writeFileSync(config.generatedPath + filePath, instrumentedCode);
  }
}


export default { writeInstrumented }
