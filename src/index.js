import {isVarWithRequireCalls, matchRequire, matchRequireWithProperty} from './helpers.js';

module.exports = function(babel) {
  return {
    visitor: {
      VariableDeclaration: function(path) {
        if (path.parent.type === 'Program') {
          debugger;
          if (isVarWithRequireCalls(path.node)) {
            let decalrationKind = path.node.kind;
            let declarations = path.node.declarations.map(
              dec => varToImport(dec, decalrationKind, babel.types)
            )

            return path.replaceWithMultiple(declarations);
          }
        }
      } 
    }
  }
}

function varToImport(dec, kind, babelTypes) {
  let t = babelTypes;
  let m;
  debugger;
  if ((m = matchRequire(dec))) {
    // if (m.id.type === 'ObjectPattern') {
    //   let specifiers = m.id.properties.map();
    //   return t.importDeclaration([t.importNamespaceSpecifier(m.id, m.id)], m.sources[0]);
    // }
    // else 
    if (m.id.type === 'Identifier') {
      return t.importDeclaration([t.importDefaultSpecifier(m.id)], m.sources[0]);
    }
  }
  else if ((m = matchRequireWithProperty(dec))) {
    if (m.property.name === 'default') {
      return t.importDeclaration([t.importDefaultSpecifier(m.id)], m.sources[0]);
    }
    debugger;
    return t.importDeclaration([t.importSpecifier(m.id, m.property)], m.sources[0])
  }
  else {
    return t.variableDeclaration(kind, [dec]);
  }
}

// function patternToNamedImport({id, sources}) {
//   return new ImportDeclaration({
//     specifiers: id.properties.map(({key, value}) => {
//       return createImportSpecifier({
//         local: value,
//         imported: key
//       });
//     }),
//     source: sources[0]
//   });
// }

// function identifierToDefaultImport({id, sources}) {
//   return new ImportDeclaration({
//     specifiers: [new ImportDefaultSpecifier(id)],
//     source: sources[0],
//   });
// }

// function propertyToNamedImport({id, property, sources}) {
//   return new ImportDeclaration({
//     specifiers: [createImportSpecifier({local: id, imported: property})],
//     source: sources[0],
//   });
// }

// function createImportSpecifier({local, imported}) {
//   if (imported.name === 'default') {
//     return new ImportDefaultSpecifier(local);
//   }
//   return new ImportSpecifier({local, imported});
// }
