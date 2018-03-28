var a = "a";

var b = require("c");

var c, d = require("e");

var f = require("g").default;

var h = require("i").j;

var k = require("l").k;

var m = require("n").o, p = "q";

var {default: foo} = require("foolib");

var {default: foo, bar: bar} = require("foolib");

function getName() {
  return "My name";
}