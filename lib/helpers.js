"use strict";
Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.matchRequireWithProperty = exports.matchRequire = undefined;

var _typeof = (typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
  return typeof obj;
} : function(obj) {
  return (obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj);
});

exports.isString = isString;
exports.matchesAst = matchesAst;
exports.isAstMatch = isAstMatch;
exports.extract = extract;
exports.matchesLength = matchesLength;
exports.isVarWithRequireCalls = isVarWithRequireCalls;
var _fp = require("lodash/fp");

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function isString(node) {
  // return node.type === 'Literal' && typeof node.value === 'string';
  return node.type === 'StringLiteral';
}

function matchesAst(pattern) {
  return function(ast) {
    return isAstMatch(ast, pattern);
  };
}

function isAstMatch(ast, pattern) {
  var extractedFields = {};

  var matches = (0, _fp.isMatchWith)(function(value, matcher) {
    if (typeof matcher === 'function') {
      var result = matcher(value);
      if (((typeof result === "undefined" ? "undefined" : _typeof(result))) === 'object') {
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

function extract(fieldName, matcher) {
  return function(ast) {
    var extractedFields = _defineProperty({}, fieldName, ast);

    if (((typeof matcher === "undefined" ? "undefined" : _typeof(matcher))) === 'object') {
      matcher = matchesAst(matcher);
    }

    if (typeof matcher === 'function') {
      var result = matcher(ast);
      if (((typeof result === "undefined" ? "undefined" : _typeof(result))) === 'object') {
        return Object.assign(extractedFields, result);
      }
      if (!result) {
        return false;
      }
    }

    return extractedFields;
  };
}

function matchesLength(pattern) {
  var matcher = matchesAst(pattern);

  return function(ast) {
    if (ast.length !== pattern.length) {
      return false;
    }
    return matcher(ast);
  };
}

var isIdentifier = matchesAst({
  type: 'Identifier'
});

// matches Property with Identifier key and value (possibly shorthand)
// TODO: Rename it to be isObjectProperty
var isSimpleProperty = matchesAst({
  type: 'ObjectProperty',
  key: isIdentifier,
  computed: false,
  value: isIdentifier
});

// matches: {a, b: myB, c, ...}
var isObjectPattern = matchesAst({
  type: 'ObjectPattern',
  properties: function properties(props) {
    return props.every(isSimpleProperty);
  }
});

// matches: require(<source>)
var matchRequireCall = matchesAst({
  type: 'CallExpression',
  callee: {
    type: 'Identifier',
    name: 'require'
  },
  arguments: extract('sources', function(args) {
    return args.length === 1 && isString(args[0]);
  })
});

var matchRequire = exports.matchRequire = matchesAst({
  type: 'VariableDeclarator',
  id: extract('id', function(id) {
    return isIdentifier(id) || isObjectPattern(id);
  }),
  init: matchRequireCall
});

var matchRequireWithProperty = exports.matchRequireWithProperty = matchesAst({
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

function isVarWithRequireCalls(node) {
  return node.type === 'VariableDeclaration' &&
    node.declarations.some(function(dec) {
      return matchRequire(dec) || matchRequireWithProperty(dec);
    });
}
