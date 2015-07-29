// this file must be ES5 as it is required before babel require hook is registered
var program = require('commander');
var fs = require('fs-extra');
var packageJson = JSON.parse(fs.readFileSync(__dirname + '/../package.json'));

program
  .description(packageJson.description)
  .version(packageJson.version)
  .usage('[options] <config file>')
  .option('-r, --single-run', 'only perform single testrun')
  .parse(process.argv);

var options = {
  singleRun: program['singleRun'],
  configFile: program.args[0]
};

module.exports = { options: options, program: program };
