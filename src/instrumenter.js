import istanbul from 'istanbul';
import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import config from './config';


const instrumenter = new istanbul.Instrumenter();

function writeInstrumented(filePaths) {
  for (let filePath of filePaths) {
    const code = fs.readFileSync(filePath, 'utf8');
    const instrumentedCode = instrumenter.instrumentSync(code, filePath);
    mkdirp.sync(config.generatedPath + path.parse(filePath).dir);
    fs.writeFileSync(config.generatedPath + filePath, instrumentedCode);
    console.log('Instrumented', filePath);
  }
}


export default { writeInstrumented }
