var My = {
  sqrt: function (x) {
    if (x < 0) throw new Error("sqrt can't work on negative number");
    return Math.exp(Math.log(x) / 2);
  },

  sum: function (a, b) {
    return a + b;
  },

  data: null,

  fetchResult: function (cb) {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener('load', function (data) {
      My.data = JSON.parse(oReq.responseText);
      console.log('loaded!');
      cb();
    });
    oReq.open('GET', 'real/app.json', true);
    oReq.send();
    return true;
  }
};
