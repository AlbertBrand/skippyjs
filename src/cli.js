// this file must be ES5 as it is required before babel require hook is registered
var program = require('commander');
var fs = require('fs-extra');
var packageJson = JSON.parse(fs.readFileSync(__dirname + '/../package.json'));

program
  .description(packageJson.description)
  .version(packageJson.version)
  .usage('[options] <config file>')
  .option('-r, --run-once', 'only perform one test run, do not watch file changes')
  .option('-s, --store-coverage', 'store coverage JSON after determining related files')
  .option('--verbose', 'verbose output')
  .parse(process.argv);

//noinspection JSUnresolvedVariable
var config = {
  runOnce: program.runOnce,
  storeCoverage: program.storeCoverage,
  verbose: program.verbose,
  configFile: program.args[0]
};


module.exports = { config: config, program: program };
