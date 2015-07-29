import chai from 'chai';
import fs from 'fs';
import testViewer from '../src/testViewer';

const expect = chai.expect;

const actualTestResult = JSON.parse(fs.readFileSync(__dirname + '/actualTestResult.json'));
const actualFailedTestResult = JSON.parse(fs.readFileSync(__dirname + '/actualFailedTestResult.json'));

describe('testViewer', function () {
  describe('getFailedTestResults', function () {
    it('should return tree with only failed tests', function () {
      expect(testViewer.getFailedTestResults(actualTestResult)).to.eql(actualFailedTestResult);
    });
  });
});
