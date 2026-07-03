const toSnakeCase = (str) => str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
const toCamelCase = (str) => str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

const convertCamelToSnake = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[toSnakeCase(key)] = value;
    return acc;
  }, {});
};

const convertSnakeToCamel = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[toCamelCase(key)] = value;
    return acc;
  }, {});
};

module.exports = {
  toSnakeCase,
  toCamelCase,
  convertCamelToSnake,
  convertSnakeToCamel,
};
