/**
 * Generate Fibonoacci numbers
 *
 */
const no_Of_fibo_Required = 10;

function* getFibo(limit) {
  var a = 0;
  var b = 1;
  yield a;
  yield b;
  for (i = 0; i < limit; i++) {
    [a, b] = [b, a + b];
    yield b;
  }
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of
for (let n of getFibo(no_Of_fibo_Required)) {
  console.log(n);
}
