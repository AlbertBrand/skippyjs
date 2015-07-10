const path = require('path');
const root = path.resolve(__dirname, '..') + path.sep;

const templatePath = root + 'template/';
const staticPath = root + 'static/';

const tmpPath = root + '.tmp/';
const coveragePath = tmpPath + 'coverage/';
const generatedPath = tmpPath + 'generated/';

const httpServerPort = 3000;

export default { templatePath, staticPath, tmpPath, coveragePath, generatedPath, httpServerPort }
