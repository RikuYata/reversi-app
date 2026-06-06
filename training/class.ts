class Fraction {

    constructor(private _numerator: number, private _denominator: number) { }

    add(other: Fraction): Fraction {
        const resultNumerator = this._numerator * other._denominator + this._denominator * other._numerator;
        const resultDenominator = this._denominator * other._denominator;
        return new Fraction(resultNumerator, resultDenominator);
    }

    toString(): string{
        return `${this._numerator}/${this.denominator}`
    }

    get numerator() {
        return this._numerator;
    }

    get denominator() {
        return this._denominator;
    }
}

const f1 = new Fraction(1, 2);
console.log(f1.numerator);
console.log(f1.denominator);

// f1.numerator = 3;
// console.log(f1.numerator);

const f2 = new Fraction(1, 3);
console.log(f1.toString());

const result  = f1.add(f2);
console.log(result.toString());

// const errResult = f1.minus(f2);