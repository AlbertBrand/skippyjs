describe('integration of My and Calc', function () {
  it('should divide 100 by 10 and add 10', function () {
    expect(My.sum(Calc.divide(100, 10), 10)).toEqual(20);
  });

  it('should compute square root of 10 and divide by 2', function () {
    expect(Calc.divide(My.sum(10, 10), 5)).toBe(4);
  });

  it("should take long", function () {
    expect(My.takesLong()).toBe("done");
  });
});
