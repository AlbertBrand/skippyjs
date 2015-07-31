import istanbul from 'istanbul';
import path from 'path';
import fs from 'fs-extra';
import mkdirp from 'mkdirp';
import colors from 'colors/safe';
import config from './config';


const instrumenter = new istanbul.Instrumenter();
const collector = new istanbul.Collector();

function writeInstrumented(filePaths) {
  for (let filePath of filePaths) {
    try {
      const code = fs.readFileSync(filePath, 'utf8');
      const instrumentedCode = instrumenter.instrumentSync(code, filePath);
      mkdirp.sync(config.generatedPath + path.parse(filePath).dir);
      fs.writeFileSync(config.generatedPath + filePath, instrumentedCode);
      if (config.debug) {
        console.log('Instrumented', filePath);
      }
    } catch (error) {
      console.log(colors.red(`Instrumentation failed: '${error.description}' in ${filePath} [${error.lineNumber}:${error.column}]`))
    }
  }
  console.log(`Instrumented ${filePaths.length} files`);
}

function writeCombinedCoverage(coverages) {
  for (let coverage of coverages) {
    collector.add(coverage);
  }
  const finalCoverage = collector.getFinalCoverage();
  collector.dispose();
  var coveragePath = config.coveragePath + 'coverage.json';
  fs.writeFileSync(coveragePath, JSON.stringify(finalCoverage, null, 2));
  if (config.debug) {
    console.log('Written', coveragePath);
  }
}


export default { writeInstrumented, writeCombinedCoverage }
