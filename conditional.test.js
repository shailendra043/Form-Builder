const { shouldShowQuestion } = require('../utils/conditional');

function assert(cond, msg) {
  if (!cond) throw new Error('Assertion failed: ' + msg);
}

// basic tests
assert(shouldShowQuestion(null, {} ) === true, 'null rules should show');

const rules1 = { logic: 'AND', conditions: [ { questionKey: 'role', operator: 'equals', value: 'Engineer' } ] };
assert(shouldShowQuestion(rules1, { role: 'Engineer' }) === true, 'AND single equals');
assert(shouldShowQuestion(rules1, { role: 'Designer' }) === false, 'AND single equals false');

const rules2 = { logic: 'OR', conditions: [ { questionKey: 'a', operator: 'equals', value: 1 }, { questionKey: 'b', operator: 'contains', value: 'x' } ] };
assert(shouldShowQuestion(rules2, { a: 0, b: ['x','y'] }) === true, 'OR contains array');

console.log('conditional utils tests passed');
