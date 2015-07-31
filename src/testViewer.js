import colors from 'colors/safe';
import _ from 'lodash';
import helper from './testHelper';


// TODO lodash-contrib overrides _.repeat and maybe others, so kill lodash-contrib

function getFailedTestResults(testResults) {
  testResults = _.cloneDeep(testResults);

  let didRemove;
  do {
    didRemove = false;
    helper.testWalker.preorder(testResults, (node, key, parent) => {
      if (!node) {
        return;
      }
      if (node.status === 'passed' || (node.children && node.children.length === 0)) {
        parent.children.splice(parent.children.indexOf(node), 1);
        didRemove = true;
      }
    });
  } while (didRemove);

  return testResults;
}

function doShow(testResults, depth) {
  let prefix = ' '.repeat(depth),
    prefixMsg = ' '.repeat(depth + 2);

  _.forEach(testResults, (testResult) => {
    console.log(prefix + testResult.description);
    if (testResult.status === 'failed') {
      console.log(prefixMsg + colors.red(_.pluck(testResult.failedExpectations, 'message').join('\n' + prefixMsg)));
    }
    if (testResult.children) {
      depth += 2;
      doShow(testResult.children, depth);
      depth -= 2;
    }
  });
}

function showTestResults(testResults) {
  if (helper.hasFailedTests(testResults)) {
    console.log(colors.bgRed('Tests failed:'));
    doShow(getFailedTestResults(testResults).children, 0);

  } else {
    console.log(colors.bgGreen.black(`${testResults.children.length} test suites succeeded`));
  }
}


export default { getFailedTestResults, showTestResults }
