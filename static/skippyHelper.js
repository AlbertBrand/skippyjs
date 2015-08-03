function getStmtCoverage(coverage) {
  var stmtCoverage = {};
  for (var file in coverage) {
    var statements = [];
    for (var key in coverage[file].s) {
      statements.push(coverage[file].s[key]);
    }
    stmtCoverage[file] = statements.join('|');
  }
  return stmtCoverage;
}

function getRelatedFiles(lastStmtCoverage, currStmtCoverage) {
  var related = [];
  for (var file in currStmtCoverage) {
    if (lastStmtCoverage[file] !== currStmtCoverage[file]) {
      related.push(file);
    }
  }
  return related;
}

function doCallback(result) {
  if (typeof callPhantom === 'function') {
    callPhantom(result);
  }
}
