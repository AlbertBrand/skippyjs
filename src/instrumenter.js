import istanbul from 'istanbul';
import path from 'path';
import fs from 'fs-extra';
import mkdirp from 'mkdirp';
import colors from 'colors/safe';
import config from './config';


const instrumenter = new istanbul.Instrumenter();

function writeInstrumented(filePaths) {
  for (let filePath of filePaths) {
    try {
      const code = fs.readFileSync(filePath, 'utf8');
      const instrumentedCode = instrumenter.instrumentSync(code, filePath);
      mkdirp.sync(config.generatedPath + path.parse(filePath).dir);
      fs.writeFileSync(config.generatedPath + filePath, instrumentedCode);
      console.log('Instrumented', filePath);
    } catch (error) {
      console.log(colors.red(`Instrumentation failed: '${error.description}' in ${filePath} [${error.lineNumber}:${error.column}]`))
    }
  }
}


export default { writeInstrumented }
