'use strict';
var expect = require('chai').expect;
var Parser = require('../src/parser');

describe('Validate default SEO rules', function() {
    var parser = new Parser({}, "text");

    it('<img /> should have alt attribute', function() {
        parser.parse("<img alt=''></img>");
        var result = parser.returnResult();
        expect(result).to.be.equal("");
    });

    it('<a /> should have rel attribute', function() {
        parser.parse("<a rel='' />");
        var result = parser.returnResult();
        expect(result).to.be.equal("");
    });

    it('<head> should have <title>, <meta name="description" /> & <meta name="keywords" /> tags', function() {
        parser.parse('<head><title>Dummy title</title><meta name="description" content="Here is a precise description of my awesome webpage."><meta name="keywords" content="HTML,CSS,XML,JavaScript"></head>');
        var result = parser.returnResult();
        expect(result).to.be.equal("");
    });

    it('Detect there are less than 3 <strong> tags', function() {
        parser.parse("<strong>Strong text</strong><strong>Strong text</strong><strong>Strong text</strong>");
        var result = parser.returnResult();
        expect(result).that.is.not.empty;
    });

    it('Detect there are more than 1 <h1> tag', function() {
        parser.parse("<h1>Strong text</h1><h1>Strong text</h1>");
        var result = parser.returnResult();
        expect(result).that.is.not.empty;
    });
    
});

describe('Validate support of new user defined SEO rule', function() {
    var parserCustom = new Parser({
        "meta": {
            "isEnabled": true,
            "query": "head",
            "conditions": [
                {
                    "children": {
                        "condition": "to.containSubset",
                        "args": [{
                            "name": "meta",
                            "attribs": {
                                "name": "robots"
                            }
                        }]
                    },
                    "error": "<head> without <meta name='robot' ... /> tag"
                }
            ]
        },
        "head": {
            "isEnabled": false
        }
    }, "text");

    it('<head> should have <meta name="robots" /> tag', function() {
        parserCustom.parse('<head><meta name="robots" content="bla bla"></head>');
        var result1 = parserCustom.returnResult();
        expect(result1).to.be.equal("");
    });
});

describe('Validate disabling default rule', function() {
    var parserCustom = new Parser({
        "head": {
            "isEnabled": false
        }
    }, "text");

    it('<meta> & <title> tag rule disabled', function() {
        parserCustom.parse('<head><title>bla bla</title><meta name="robots" content="bla bla"></head>');
        var result1 = parserCustom.returnResult();
        expect(result1).to.be.equal("");
    });

});

describe('Validate overriding default rule', function() {
    var parserCustom = new Parser({
        "strong": {
            "isEnabled": true,
            "query": "strong",
            "conditions": [
                {
                    "self": {
                        "condition": "length.to.be.below",
                        "args": 2
                    },
                    "error": "There are more than 2 <strong> tag in HTML"
                }
            ]
        }
    }, "text");

    it('Detect there are more than 2 <strong> tags', function() {
        parserCustom.parse("<strong>Strong text</strong><strong>Strong text</strong><strong>Strong text</strong>");
        var result = parserCustom.returnResult();
        expect(result).that.is.not.empty;
    });
});