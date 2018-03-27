import {isVarWithRequireCalls} from './helpers.js';

module.exports = function(babel) {
  return {
    visitor: {
      VariableDeclaration: function(path) {
        if (path.parent.type === 'Program') {
          if (isVarWithRequireCalls(path.node)) {
            console.log("\nfound a var with require calls\n".toUpperCase());
            return path.replaceWithMultiple([path.node]);
          }
        }
      } 
    }
  }
}