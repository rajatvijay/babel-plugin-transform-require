"use strict";
var _helpers = require("./helpers.js");
var _babelCore = require("babel-core");

module.exports = function(babel) {
  return {
    visitor: {
      VariableDeclaration: function VariableDeclaration(path) {
        if (path.parent.type === 'Program') {
          debugger;
          if ((0, _helpers.isVarWithRequireCalls)(path.node)) {
            var decalrationKind = path.node.kind;
            var declarations = path.node.declarations.map(
              function(dec) {
                return varToImport(dec, decalrationKind);
              }
            );

            return path.replaceWithMultiple(declarations);
          }
        }
      } 
    }
  };
}

function varToImport(dec, kind) {
  var m = void 0;
  if ((m = (0, _helpers.matchRequire)(dec))) {
    if (m.id.type === 'ObjectPattern') {
      return patternToNamedImport(m);
    }
    else if (m.id.type === 'Identifier') {
      return _babelCore.types.importDeclaration([_babelCore.types.importDefaultSpecifier(m.id)], m.sources[0]);
    }
  }
  else if ((m = (0, _helpers.matchRequireWithProperty)(dec))) {
    if (m.property.name === 'default') {
      return _babelCore.types.importDeclaration([_babelCore.types.importDefaultSpecifier(m.id)], m.sources[0]);
    }
    return _babelCore.types.importDeclaration([_babelCore.types.importSpecifier(m.id, m.property)], m.sources[0]);
  }
  else {
    return _babelCore.types.variableDeclaration(kind, [dec]);
  }
}

function patternToNamedImport(_ref) {
  var id = _ref.id, sources = _ref.sources;
  return _babelCore.types.importDeclaration(
    id.properties.map(function(_ref2) {
      var key = _ref2.key, value = _ref2.value;
      if (key.name === 'default') {
        return _babelCore.types.importDefaultSpecifier(value);
      }
      return _babelCore.types.importSpecifier(value, key);
    }),
    sources[0]
  );
}
