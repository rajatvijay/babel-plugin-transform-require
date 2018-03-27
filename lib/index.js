"use strict";
var _helpers = require("./helpers.js");

module.exports = function(babel) {
  return {
    visitor: {
      VariableDeclaration: function VariableDeclaration(path) {
        if (path.parent.type === 'Program') {
          if ((0, _helpers.isVarWithRequireCalls)(path.node)) {
            console.log("\nfound a var with require calls\n".toUpperCase());
            return path.replaceWithMultiple([path.node]);
          }
        }
      } 
    }
  };
}