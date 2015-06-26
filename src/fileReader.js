function readFiles(folder, tests, code) {
    var files = fs.readdirSync(folder),
        i,
        n,
        fileName;

    for(i = 0, n = files.length; i < n; i += 1) {
        fileName = folder + '/' + files[i];
        if(fs.lstatSync(fileName).isDirectory()) {
            readFiles(fileName, tests, code);
        }
        if(fileName.match(/\.spec\.js/)) {
            tests.push(fileName);
        } else if(fileName.match(/\.js/)){
            code.push(fileName);
        }
    }
    return {tests: tests, code: code};
}
console.log(readFiles('./testsrc', [], []));

export readFiles;