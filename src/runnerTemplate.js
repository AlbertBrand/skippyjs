import fs from 'fs-extra';
import compile from 'es6-template-strings/compile';
import resolveToString from 'es6-template-strings/resolve-to-string';
import crypto from 'crypto';
import config from './config';


const SCRIPT_TEMPLATE = compile('<script src="${src}"></script>', 'utf8');
const RUNNER_TEMPLATE = compile(fs.readFileSync(config.templatePath + 'runner.html', 'utf8'));

function getRunnerFileName(testFile) {
  let hash = crypto.createHash('md5').update(testFile).digest('hex');
  return 'runner-' + hash + '.html';
}

function createRunnerFile(srcFiles, testFile) {
  let includes = [...srcFiles, testFile].map((src) => {
    return resolveToString(SCRIPT_TEMPLATE, { src: src });
  }).join('\n');
  let out = resolveToString(RUNNER_TEMPLATE, { includes: includes });
  let indexFileName = getRunnerFileName(testFile);

  fs.writeFileSync(config.generatedPath + indexFileName, out);
  return indexFileName;
}


export default { getRunnerFileName, createRunnerFile }
