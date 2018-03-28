import {isMatchWith} from 'lodash/fp';

/**
 * True when the given node is string literal.
 * @param  {Object}  node
 * @return {Boolean}
 */
export function isString(node) {
  // return node.type === 'Literal' && typeof node.value === 'string';
  return node.type === 'StringLiteral';
}

/**
 * Creates a function that matches AST against the given pattern,
 *
 * See: isAstMatch()
 *
 * @param  {Object} pattern Pattern to test against
 * @return {Function} Function that returns an object with
 * extracted fields or false when no match found.
 */
export function matchesAst(pattern) {
  return (ast) => isAstMatch(ast, pattern);
}

/**
 * Matches AST against the given pattern,
 *
 * Similar to LoDash.isMatch(), but with the addition that a Function
 * can be provided to assert various conditions e.g. checking that
 * number is within a certain range.
 *
 * Additionally there are utility functions:
 *
 * - extract() can be used to give names to the parts of AST -
 *   these are then returned as a map of key-value pairs.
 *
 * - matchesLength() ensures the exact array length is respected.
 *
 * @param  {Object} ast The AST node to test
 * @param {Object} pattern Pattern to test against
 * @return {Object/Boolean} an object with extracted fields
 * or false when no match found.
 */
export function isAstMatch(ast, pattern) {
  const extractedFields = {};

  const matches = isMatchWith((value, matcher) => {
    if (typeof matcher === 'function') {
      const result = matcher(value);
      if (typeof result === 'object') {
        Object.assign(extractedFields, result);
      }
      return result;
    }
  }, pattern, ast);

  if (matches) {
    return extractedFields;
  }
  else {
    return false;
  }
}

/**
 * Utility for extracting values during matching with matchesAst()
 *
 * @param {String} fieldName The name to give for the value
 * @param {Function|Object} matcher Optional matching function or pattern for matchesAst()
 * @return {Function}
 */
export function extract(fieldName, matcher) {
  return (ast) => {
    const extractedFields = {[fieldName]: ast};

    if (typeof matcher === 'object') {
      matcher = matchesAst(matcher);
    }

    if (typeof matcher === 'function') {
      const result = matcher(ast);
      if (typeof result === 'object') {
        return Object.assign(extractedFields, result);
      }
      if (!result) {
        return false;
      }
    }

    return extractedFields;
  };
}

/**
 * Utility for asserting that AST also matches the exact length
 * of the specified array pattern (in addition to matching
 * the first items in the array).
 *
 * @param {Array} pattern
 * @return {Function}
 */
export function matchesLength(pattern) {
  const matcher = matchesAst(pattern);

  return (ast) => {
    if (ast.length !== pattern.length) {
      return false;
    }
    return matcher(ast);
  };
}

const isIdentifier = matchesAst({
  type: 'Identifier'
});

// matches Property with Identifier key and value (possibly shorthand)
// TODO: Rename it to be isObjectProperty
const isSimpleProperty = matchesAst({
  type: 'ObjectProperty',
  key: isIdentifier,
  computed: false,
  value: isIdentifier
});

// matches: {a, b: myB, c, ...}
const isObjectPattern = matchesAst({
  type: 'ObjectPattern',
  properties: (props) => props.every(isSimpleProperty)
});

// matches: require(<source>)
const matchRequireCall = matchesAst({
  type: 'CallExpression',
  callee: {
    type: 'Identifier',
    name: 'require'
  },
  arguments: extract('sources', (args) => {
    return args.length === 1 && isString(args[0]);
  })
});

/**
 * Matches: <id> = require(<source>);
 */
export const matchRequire = matchesAst({
  type: 'VariableDeclarator',
  id: extract('id', id => isIdentifier(id) || isObjectPattern(id)),
  init: matchRequireCall
});

/**
 * Matches: <id> = require(<source>).<property>;
 */
export const matchRequireWithProperty = matchesAst({
  type: 'VariableDeclarator',
  id: extract('id', isIdentifier),
  init: {
    type: 'MemberExpression',
    computed: false,
    object: matchRequireCall,
    property: extract('property', {
      type: 'Identifier'
    })
  }
});

/**
 * Matches: var <id> = require(<source>);
 *          var <id> = require(<source>).<property>;
 */
export function isVarWithRequireCalls(node) {
  return node.type === 'VariableDeclaration' &&
    node.declarations.some(dec => matchRequire(dec) || matchRequireWithProperty(dec));
}
