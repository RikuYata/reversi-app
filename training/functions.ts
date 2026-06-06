function mul1(v1: number, v2: number): number {
    return v1 * v2;
}

const result1 = mul1(1, 3);

console.log(result1);

function mul2(v1: number, v2: number){
    return v1 * v2;
}

const result2 = mul2(10, 20);
console.log(result2);

// const result3 = mul2("hello", 20);
// console.log(result2);

function mul3(v1: any, v2: any) {
    return v1 * v2;
}

const result3 = mul3(100, 200);
console.log(result3);
const result4 = mul3("hello", 200);
console.log(result4);