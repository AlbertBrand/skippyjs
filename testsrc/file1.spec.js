describe("sqrt", function() {
  it("should compute the square root of 4 as 2", function() {
    expect(My.sqrt(4)).toEqual(2);
  });

  it("should compute the square root of 2 not as 2", function() {
    expect(My.sqrt(2)).not.toEqual(2);
  });

  it("should sum", function () {
    expect(My.sum(1, 2)).toBe(3);
  });
});
