'use strict';

var fs = require('fs');
var cheerio = require('cheerio');
var sprintf = require("sprintf-js").sprintf;
var stream = require('stream');
var util = require('util');
var Readable = require('stream').Readable;
var Writable = require('stream').Writable;
//load default rules
var defaultRules = require("../config/rules.json");
var baseRule = require('./rules');

/**
 * Creates a new Parser object.
 * @class Parser
 * @constructor
 * @param {RuleConfiguration|string} config A valid configuration options object or configuration as a JSON string.
 * @param {string} [output=console] Type of output. Supported output types are console, file & stream. For file type, result.txt will be created after successful execution.
 * @returns {Parser}
 * @since 1.0.0
 * @example
 *
 * var Parser = require('parser');
 *
 * var parser = new Parser({}, "console");
 *
 * parser.parseFile("home.html");
 * 
 *
 */
function Parser(config, output) {
    this.rules = Object.assign(JSON.parse(JSON.stringify(defaultRules)), baseRule);

    var me = this;
    Object.keys(this.rules).forEach(key => {
        if (key === "_base") return;
    
        //add condition level base properties
        var conditions = [];
        me.rules[key].conditions.forEach(con => {
            conditions.push(Object.assign(con, me.rules["_base"]));
        });
        me.rules[key].conditions = conditions;
        me.rules[key].findElements = me.rules["_base"].findElements;
        me.rules[key].parse = me.rules["_base"].parse;
    });
    
    if (typeof config === "string") config = JSON.parse(config);
    this.output = (output == undefined || output == null ? "console" : output);

    if (this.output == "stream") {
        this._outputReadStream; //stream on which result will be written, outputWriteStream will pipe the data
        this._outputWriteStream = this._createWritableStream();

        /**
        @property {Object} outputWriteStream Writable node stream on which output will be written.
        @readonly
        **/
        Object.defineProperty(this, 'outputWriteStream', {
            get: function() { 
                return me._outputWriteStream; 
            }
        });
    }
    
    //override default rule properties; enable/disable, override behavior
    //or add new rules to config
    if (typeof config === "object") {
        Object.keys(config).forEach(key => {
            if (!me.rules[key] && (!config[key].hasOwnProperty("isEnabled") || !config[key].hasOwnProperty("query") || !config[key].hasOwnProperty("conditions"))) {
                return console.log("Invalid rule " + key);
            }
            if (!me.rules[key]) { //new rule defined in config
                me.rules[key] = {};
                me.rules[key].findElements = me.rules["_base"].findElements;
                me.rules[key].parse = me.rules["_base"].parse;
            }

            if (config[key].isEnabled !== undefined) {
                me.rules[key].isEnabled = !!config[key].isEnabled;
            }
            if (config[key].query !== undefined)
                me.rules[key].query = config[key].query;
            if (config[key].conditions !== undefined && config[key].conditions instanceof Array) {
                var conditions = [];
                config[key].conditions.forEach(con => {
                    conditions.push(Object.assign(con, me.rules["_base"]));
                });
                me.rules[key].conditions = conditions
            }
        });
    }
}

Parser.prototype._createWritableStream = function() {
    this._outputReadStream = new Readable({
        objectMode: true,
        read() {}
    });

    var wStream = new Writable({
        objectMode: true,
        write: (data, _, done) => { //write on console by default, user need to override write
            console.log(data);
            done();
        }
    });

    this._outputReadStream.pipe(wStream);
    return wStream;
}

Parser.prototype._parseHTML = function(html) {
    var $ = cheerio.load(html, {
        normalizeWhitespace: true,
        xmlMode: true,
        lowerCaseTags: true,
        lowerCaseAttributeNames: true
    });
    return $;
}

/**
 * Parse HTML. 
 * @method parse
 * @public
 * @param {string} html - HTML content.
 * @memberof Parser.prototype
 * @since 1.0.0
 */
Parser.prototype.parse = function(html) {
    var elements = this._parseHTML(html), me = this;
    Object.keys(this.rules).forEach(key => {
        if (key === "_base") return;
        var rule = me.rules[key];
        if (rule.isEnabled) {
            return rule.parse(elements, rule.conditions);
        }
    });
}

Parser.prototype.returnResult = function() {
    var me = this;
    var _fnOutputString = function() {
        var str = "";
        Object.keys(me.rules).forEach(key => {
            if (key === "_base") return;
            var rule = me.rules[key];
            if (rule.isEnabled) {
                rule.conditions.forEach(con => {
                    if (con.failCount > 0) {
                        str = str == "" ? sprintf(con.error, con.failCount) : str + "\n" + sprintf(con.error, con.failCount);
                    }
                });
            }
        });
        return str;
    }
    if (this.output === "console") {
        console.log(_fnOutputString());
    } else if (this.output == "text") { //for tests
        return _fnOutputString();
    } else if (this.output == "stream") {
        this._outputReadStream.push(_fnOutputString());
    } else { //write file
        var fileName = "result.txt";
        fs.writeFile(fileName, _fnOutputString(), function (err) {
            if (err) {
                return console.log(err);
            }
            console.log(sprintf("Parsed HTML and saved output in %s file", fileName));
        });
    }
}

/**
 * Parse HTML file. 
 * @method parseFile
 * @public
 * @param {string} file - Valid disk path of an HTML file.
 * @memberof Parser.prototype
 * @since 1.0.0
 */
Parser.prototype.parseFile = function(file) {
    var me = this;
    fs.readFile(file, function read(err, data) {
        if (err) {
            console.log("Invalid file path");
            return;
        }
        me.parse(data.toString().replace((/  |\r\n|\n|\r/gm),"")); //replace newlines and tabs
        me.returnResult();
    });
}

/**
 * Parse HTML from stream. 
 * @method parseStream
 * @public
 * @param {Object} stream - Valid node readable stream.
 * @memberof Parser.prototype
 * @since 1.0.0
 */
Parser.prototype.parseStream = function(stream) {
    if (typeof stream !== "object" && typeof stream.on !== "function") {
        return console.log("Invalid stream object");
    }
    var me = this;
    stream.on('data', function (buf) {
        me.parse(buf.toString().replace((/  |\r\n|\n|\r/gm),"")); //replace newlines and tabs
    });

    stream.on('end', function () {
        me.returnResult();
    });
}

module.exports = Parser;

