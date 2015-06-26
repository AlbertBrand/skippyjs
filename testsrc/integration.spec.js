describe('integration of My and Calc', function () {
    it('should divide 100 by 10 and add 10', function () {
        My.sum(Calc.divide(100,10), 10).toEqual(20);
    });

    it('should compute square root of 10 and divide by 2', function () {
        Calc.divide(My.sqrt(10), 2).toEqual(50);
    });
});