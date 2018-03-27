"use strict";
var _helpers = require("./helpers.js");

module.exports = function(babel) {
  return {
    visitor: {
      VariableDeclaration: function VariableDeclaration(path) {
        if ((0, _helpers.isVarWithRequireCalls)(path.node)) {
          console.log("\nfound a var with require calls\n".toUpperCase());
          // if (path.node.parent.type !== 'Program') {
            // console.log('Nested require call');
            // return;  
          // }

          // console.log("inside plugin", path.node);
          return path.replaceWithMultiple([path.node]);
        }
      } 
    }
  };
}