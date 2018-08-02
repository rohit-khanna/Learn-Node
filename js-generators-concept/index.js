/**
 * Here every time a next() is invoked, the control flows till the next 'yield' and giving out outputs
 */
function* generator1() {
  console.log("1");
  yield 1;
  console.log("2");
  console.log("3");
  yield 2;
  console.log("4");
  console.log("5");
  return 3;
}

console.log("welcome");
var gen1 = generator1();
console.log(gen1.next());
console.log(gen1.next());
console.log(gen1.next());
