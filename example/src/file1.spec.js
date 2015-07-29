describe("My", function () {
  it("should compute the square root of 4 as 2", function () {
    expect(My.sqrt(4)).toEqual(2);
  });

  it("should compute the square root of 2 not as 2", function () {
    expect(My.sqrt(2)).not.toEqual(2);
  });

  it("should do something with the DOM", function () {
    expect(document.body).not.toBe(document.head);
  });

  describe("inner suite", function () {
    it("should sum", function () {
      expect(My.sum(1, 2)).toBe(3);
    });

    it("should not sum incorrectly", function () {
      expect(My.sum(1, 2)).not.toBe(4);
    });
  });
});
