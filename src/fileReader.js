/* LIBRARIES */
import fs from 'fs-extra';

export default function fileReader (folder, tests, code) {
    if(!tests) tests = [];
    if(!code) code = [];
    var files = fs.readdirSync(folder),
        i,
        n,
        fileName;

    for(i = 0, n = files.length; i < n; i += 1) {
        fileName = folder + '/' + files[i];
        if(fs.lstatSync(fileName).isDirectory()) {
            fileReader(fileName, tests, code);
        }
        if(fileName.match(/\.spec\.js/)) {
            tests.push(fileName);
        } else if(fileName.match(/\.js/)){
            code.push(fileName);
        }
    }
    return {testFiles: tests, codeFiles: code};
}
