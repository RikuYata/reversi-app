function add(v1: number, v2: number) {
    return v1 + v2;
}

function calculate(v1: number, v2: number, callback: (a: number, b: number) => number): number
{
    return callback(v1, v2);
}

const addResult = calculate(1, 2, add);

console.log(addResult);

function multiply(v1: number, v2: number): number {
    return v1 * v2;
}

const multiplyResult = calculate(1, 2, multiply)
console.log(multiplyResult);

// function hello(){
//     console.log('hello');
// }

const hello = () => {
    console.log("hello");
}

setTimeout(() => {console.log("hello")}, 5000);