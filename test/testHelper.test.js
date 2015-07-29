import chai from 'chai';
import testHelper from '../src/testHelper';

const expect = chai.expect;

const withNestedPassed = {
  children: [{
    children: [{
      status: 'passed'
    }],
    status: 'finished'
  }]
};
const withNestedFailed = {
  children: [{
    children: [{
      status: 'failed'
    }],
    status: 'finished'
  }]
};


describe('testHelper', function () {
  describe('hasFailedTests', function () {
    it('should return boolean based on passed/failed testResults', function () {
      expect(testHelper.hasFailedTests(withNestedPassed)).to.be.false;
      expect(testHelper.hasFailedTests(withNestedFailed)).to.be.true;
    });
  });
});
