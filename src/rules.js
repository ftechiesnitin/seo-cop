'use strict';

var htmlparser = require('htmlparser');
var assume = require('assumejs');
var chaiSubset = require('chai-subset');
assume.chaiUse(chaiSubset);

var Rules = {
    "_base": {
        failCount: 0,
        findElements: function(elements) {
            var els = elements.html(elements(this.query));
            
            var handler = new htmlparser.DefaultHandler(function (error, dom) {});
            var parser = new htmlparser.Parser(handler);
            parser.parseComplete(els);
            return handler.dom;
        },
        parse: function(elements) {
            elements = this.findElements(elements);
            
            var _runRule = function(obj, condition, args) {
                var props = condition.split(".");
                var runOnObj = assume(obj);
                for(var i=0; i<props.length; i++) {
                    if (i == props.length-1) {
                        if (typeof runOnObj[props[i]] !== "function") {
                            throw "Invalid rule";
                        }
                        return runOnObj[props[i]](args);
                    } 
                    runOnObj = runOnObj[props[i]];
                }
            };

            //got the json
            this.conditions.forEach(con => {
                assume.overwriteNotify(function (_super) {
                    return function (err, context) {
                        con.failCount++;
                    };
                });
                if(con.attribute || con.children) {
                    var type = con.attribute ? "attribute" : "children";
                    elements.forEach(element => {
                        try {
                            var obj = (con.attribute ? element.attribs : element.children);
                            if (!obj) obj = {};
                            _runRule(obj, con[type].condition, con[type].args);
                        } catch (err) {
                            con.inValidRule = true;
                        }
                    });
                } else if (con.self) {
                    try {
                        _runRule(elements, con.self.condition, con.self.args);
                    } catch (err) {
                        con.inValidRule = true;
                    }
                }
                //console.log(con);
            });
            return true;
        }
    }
};

module.exports = Rules;