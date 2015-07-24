import fs from 'fs';
import chai from 'chai';
import testViewer from '../src/testViewer';

const expect = chai.expect;

const withNestedPassed = {
  children: [{
    children: [{
      status: 'passed'
    }],
    status: 'finished'
  }]
}

const withNestedFailed = {
  children: [{
    children: [{
      status: 'failed'
    }],
    status: 'finished'
  }]
}

const actualTestResult = JSON.parse(fs.readFileSync(__dirname + '/actualTestResult.json'));
const actualFailedTestResult = JSON.parse(fs.readFileSync(__dirname + '/actualFailedTestResult.json'));

describe('testViewer', function () {
  describe('hasFailedTests', function () {
    it('should return boolean based on passed/failed testResults', function () {
      expect(testViewer.hasFailedTests(withNestedPassed)).to.be.false;
      expect(testViewer.hasFailedTests(withNestedFailed)).to.be.true;
    });
  });

  describe('getFailedTestResults', function () {
    it('should return tree with only failed tests', function () {
      expect(testViewer.getFailedTestResults(actualTestResult)).to.eql(actualFailedTestResult);
    });
  });

});
