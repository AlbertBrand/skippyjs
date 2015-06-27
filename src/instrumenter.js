/* LIBRARIES */
import istanbul from 'istanbul';
import path from 'path';
import fs from 'fs';

/* CUSTOM MODULES */
import { testSrcPath, tmpPath, coveragePath, templatePath, staticPath} from './config';


function writeInstrumented(files) {
  let instrumenter = new istanbul.Instrumenter();
  let instruFiles = [];
  for (let file of files) {
    let code = fs.readFileSync(file, 'utf8');
    let instrumentedName = path.parse(file).name + '.instrumented.js';
    let instrCode = instrumenter.instrumentSync(code, file);
    fs.writeFileSync(tmpPath + instrumentedName, instrCode);
    instruFiles.push(instrumentedName);
  }
  return instruFiles;
}

export default { writeInstrumented };
