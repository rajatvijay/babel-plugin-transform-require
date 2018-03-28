import {isVarWithRequireCalls, matchRequire, matchRequireWithProperty} from './helpers.js';
import {types as t} from "babel-core";

module.exports = function(babel) {
  return {
    visitor: {
      VariableDeclaration: function(path) {
        if (path.parent.type === 'Program') {
          debugger;
          if (isVarWithRequireCalls(path.node)) {
            let decalrationKind = path.node.kind;
            let declarations = path.node.declarations.map(
              dec => varToImport(dec, decalrationKind)
            )

            return path.replaceWithMultiple(declarations);
          }
        }
      } 
    }
  }
}

function varToImport(dec, kind) {
  let m;
  if ((m = matchRequire(dec))) {
    if (m.id.type === 'ObjectPattern') {
      return patternToNamedImport(m);
    }
    else if (m.id.type === 'Identifier') {
      return t.importDeclaration([t.importDefaultSpecifier(m.id)], m.sources[0]);
    }
  }
  else if ((m = matchRequireWithProperty(dec))) {
    if (m.property.name === 'default') {
      return t.importDeclaration([t.importDefaultSpecifier(m.id)], m.sources[0]);
    }
    return t.importDeclaration([t.importSpecifier(m.id, m.property)], m.sources[0])
  }
  else {
    return t.variableDeclaration(kind, [dec]);
  }
}

function patternToNamedImport({id, sources}) {
  return t.importDeclaration(
    id.properties.map(({key, value}) => {
      if (key.name === 'default') {
        return t.importDefaultSpecifier(value);
      }
      return t.importSpecifier(value, key)
    }),
    sources[0]
  )
}
