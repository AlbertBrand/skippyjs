var My = {
  sqrt: function (x) {
    if (x < 0) throw new Error("sqrt can't work on negative number");
    return Math.exp(Math.log(x) / 2);
  },

  sum: function (a, b) {
    return a + b;
  },

  takesLong: function() {
    for(var i=0; i<1000000000; i++) {
    }
    return "done";
  }
};

