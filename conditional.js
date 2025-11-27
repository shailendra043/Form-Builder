export function shouldShowQuestion(rules, answersSoFar) {
  if (!rules) return true;
  const { logic, conditions } = rules;
  if (!Array.isArray(conditions) || conditions.length === 0) return true;

  const evalCondition = (cond) => {
    try {
      const left = answersSoFar?.[cond.questionKey];
      const val = cond.value;
      switch (cond.operator) {
        case 'equals':
          return left === val;
        case 'notEquals':
          return left !== val;
        case 'contains':
          if (Array.isArray(left)) return left.includes(val);
          if (typeof left === 'string') return left.includes(String(val));
          return false;
        default:
          return false;
      }
    } catch (e) {
      return false;
    }
  };

  if (logic === 'AND') return conditions.every(evalCondition);
  return conditions.some(evalCondition);
}
