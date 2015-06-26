/* LIBRARIES */
import fs from 'fs-extra';

export default function fileReader(folder, tests, code) {
  if (!tests) tests = [];
  if (!code) code = [];
  let files = fs.readdirSync(folder);

  for (let file of files) {
    let filePath = folder + '/' + file;
    if (fs.lstatSync(filePath).isDirectory()) {
      fileReader(filePath, tests, code);
    }
    if (filePath.match(/\.spec\.js/)) {
      tests.push(filePath);
    } else if (filePath.match(/\.js/)) {
      code.push(filePath);
    }
  }

  return { testFiles: tests, codeFiles: code };
}
