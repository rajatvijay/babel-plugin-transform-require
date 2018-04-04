import transformRequire from '../src/index';
import {transform} from 'babel-core';

// Generic transformation asserter, to be called like:
//
//   expectTransform("code")
//     .toReturn("transformed code");
//     .withWarnings(["My warning"]);
//
function expectTransform (script) {
  const {code} = transform(script, {
    plugins: [transformRequire]
  });

  return {
    toReturn(expectedValue) {
      expect(code).toEqual(expectedValue);
      return this;
    },
  };
}

// Asserts that transforming the string has no effect,
// and also allows to check for warnings like so:
//
//   expectNoChange("code")
//     .withWarnings(["My warning"]);
//
function expectNoChange (script) {
  return expectTransform (script).toReturn (script);
}


describe ('Import CommonJS', () => {
  describe ('default import', () => {
    test('should convert basic var/let/const with require()', () => {
      expectTransform ('var   foo = require("foo");').toReturn (
        'import foo from "foo";'
      );
      expectTransform ('const foo = require("foo");').toReturn (
        'import foo from "foo";'
      );
      expectTransform ('let   foo = require("foo");').toReturn (
        'import foo from "foo";'
      );
    });

    test('should do nothing with var that contains no require()', () => {
      expectNoChange ('var foo = "bar";');
      expectNoChange ('var foo;');
    });

    test('should do nothing with require() that does not have a single string argument', () => {
      expectNoChange ('var foo = require();');
      expectNoChange ('var foo = require("foo", {});');
      expectNoChange ('var foo = require(bar);');
      expectNoChange ('var foo = require(123);');
    });

    test('should convert var with multiple require() calls', () => {
      expectTransform (
        'var foo = require("foo"), bar = require("bar");'
      ).toReturn ('import foo from "foo";\n' + 'import bar from "bar";');
    });

    test('should convert var/let/const with intermixed require() calls and normal initializations', () => {
      expectTransform ('var foo = require("foo"), bar = 15;').toReturn (
        'import foo from "foo";\n' + 'var bar = 15;'
      );

      expectTransform ('let abc, foo = require("foo")').toReturn (
        'let abc;\n' + 'import foo from "foo";'
      );

      expectTransform (
        'const greeting = "hello", foo = require("foo");'
      ).toReturn ('const greeting = "hello";\n' + 'import foo from "foo";');
    });

    // It would be nice to preserve the combined declarations,
    // but this kind of intermixed vars should really be a rare edge case.
    test('does not need to preserve combined variable declarations', () => {
      expectTransform ('var foo = require("foo"), bar = 1, baz = 2;').toReturn (
        'import foo from "foo";\n' + 'var bar = 1;\n' + 'var baz = 2;'
      );
    });

    test('should ignore require calls inside statements', () => {
      expectNoChange (
        'if (true) {\n' + '  var foo = require("foo");\n' + '}'
      );
    });

    test('should treat require().default as default import', () => {
      expectTransform ('var foo = require("foolib").default;').toReturn (
        'import foo from "foolib";'
      );
    });

    test('should treat {default: foo} destructuring as default import', () => {
      expectTransform ('var {default: foo} = require("foolib");').toReturn (
        'import foo from "foolib";'
      );
    });

    test('should recognize default import inside several destructurings', () => {
      expectTransform (
        'var {default: foo, bar: bar} = require("foolib");'
      ).toReturn ('import foo, { bar } from "foolib";');
    });
  });

  describe ('named import', () => {
    test('should convert foo = require().foo to named import', () => {
      expectTransform ('var foo = require("foolib").foo;').toReturn (
        'import { foo } from "foolib";'
      );
    });

    test('should convert bar = require().foo to aliased named import', () => {
      expectTransform ('var bar = require("foolib").foo;').toReturn (
        'import { foo as bar } from "foolib";'
      );
    });

    test('should convert simple object destructuring to named import', () => {
      expectTransform ('var {foo} = require("foolib");').toReturn (
        'import { foo } from "foolib";'
      );
    });

    test('should convert aliased object destructuring to named import', () => {
      expectTransform ('var {foo: bar} = require("foolib");').toReturn (
        'import { foo as bar } from "foolib";'
      );
    });

    test('should convert multi-field object destructurings to named imports', () => {
      expectTransform (
        'var {foo, bar: myBar, baz} = require("foolib");'
      ).toReturn ('import { foo, bar as myBar, baz } from "foolib";');
    });

    test('should ignore array destructuring', () => {
      expectNoChange ('var [a, b, c] = require("foolib");');
    });

    test('should ignore nested object destructuring', () => {
      expectNoChange ('var { foo: { bar } } = require("foolib");');
    });

    test('should ignore destructuring of require().foo', () => {
      expectNoChange ('var { foo } = require("foolib").foo;');
    });
  });

  describe ('comments', () => {
    test('should preserve comments before var declaration', () => {
      expectTransform ('// Comments\n' + 'var foo = require("foo");').toReturn (
        '// Comments\n' + 'import foo from "foo";'
      );
    });
  });

  // Not yet supported things...

  test('should not convert assignment of require() call', () => {
    expectNoChange ('foo = require("foo");');
  });

  test('should not convert unassigned require() call', () => {
    expectNoChange ('require("foo");');
  });
});
