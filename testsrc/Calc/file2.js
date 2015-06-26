var Calc = {
  substract: function (a, b) {
    return a - b;
  },
  divide: function (a, b) {
    if (b === 0) {
      throw new Error("Can't divide by zero")
    }
    return a / b;
  }
};
