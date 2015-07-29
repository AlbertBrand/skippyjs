import _ from 'lodash-contrib';


const testWalker = _.walk((node) => {
  return node && node.children;
});

function hasFailedTests(testResults) {
  return !!testWalker.find(testResults, (node) => {
    return node.status === 'failed';
  });
}


export default { testWalker, hasFailedTests }
