describe("sqrt", function() {
    it("should subtract b from a", function() {
        expect(Calc.substract(10, 6)).toEqual(4);
    });

    it("should throw error when dividing by zero", function() {
        expect(Calc.divide(10, 0)).toThrow();
    });

    it("should divide a by b", function () {
        expect(My.sum(100, 10)).toBe(10);
    });
});
