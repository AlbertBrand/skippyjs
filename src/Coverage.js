/* LIBRARIES */
import fs from 'fs-extra';
import path from 'path';
import phantom from 'phantom';
import compile from 'es6-template-strings/compile';
import resolveToString from 'es6-template-strings/resolve-to-string';
import crypto from 'crypto';

/* CUSTOM MODULES */
import { testSrcPath, tmpPath, coveragePath, templatePath, staticPath, port} from './config';
import server from './server';

// prepare html template
let scriptTemplate = compile('<script src="${src}"></script>', 'utf8');
let runnerTemplate = compile(fs.readFileSync(templatePath + 'runner.html', 'utf8'));

export default function (instruFiles, testFiles) {
    phantom.create((ph) => {

        function doCoverage(srcFiles, dest) {
            let includes = srcFiles.map((src) => {
                return resolveToString(scriptTemplate, {src: src});
            }).join('\n');
            let out = resolveToString(runnerTemplate, {includes: includes});
            let hash = crypto.createHash('md5').update(out).digest('hex');

            let fileName = 'index-' + hash + '.html';
            fs.writeFileSync(tmpPath + fileName, out);

            return new Promise((resolve, reject) => {
                ph.createPage((page) => {
                    page.open('http://localhost:' + port + '/' + fileName, () => {
                        page.evaluate(() => {
                            return __coverage__;
                        }, (result) => {
                            storeCoverage(result, dest);
                            resolve();
                        });
                    });
                });
            });
        }

        // store coverage
        function storeCoverage(coverage, fileName) {
            fs.writeFileSync(coveragePath + fileName, JSON.stringify(coverage), 'utf8');
        }

        // prepare run of instrumentation
        let promises = [
            doCoverage(instruFiles, 'no-test.coverage.json')
        ];

        for (let file of testFiles) {
            let coverageFileName = path.parse(file).name + '.coverage.json';
            promises.push(doCoverage([...instruFiles, file], coverageFileName));
        }

        // run instrumentation for all specs
        Promise.all(promises).then(() => {
            console.log('Closing phantom & server');
            ph.exit();
            server.close();
        });

    });
}