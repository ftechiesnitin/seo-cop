# SEO Cop
## Node.js package to parse HTML and show SEO defects

#### Installation

Install SEO Cop globally using [npm](https://www.npmjs.com/): 

```bash
npm install -g seo-cop
```

To install the latest version on npm locally and save it in your package's package.json file:

```bash
npm install --save-dev seo-cop
```

#### Usage & Examples

```
var Parser = require('parser');

//simple HTML file parsing and printing defects on console
var parser = new Parser({}, "console");
parser.parseFile("home.html");


//input stream and parse data by reading stream. Print defects on console
var fs = require('fs');
var parser = new Parser({}, "console");
var s = fs.createReadStream("home.html");
parser.parseStream(s);


//simple HTML file parsing and write defacts in output file
var parser = new Parser({}, "file");
parser.parseFile("home.html");


//simple HTML file parsing and get result on write stream
var parser = new Parser({}, "stream");
var wStream = parser.outputWriteStream;
wStream.write = function(data, _, done) {
    console.log(data);
    done();
}
parser.parseFile("home.html");


//Disable, Override, Define new rules and match conditions
var parser = new Parser({
    "h1": {
        "isEnabled": false //disable default h1 rule
    },
    "strong": {
        "isEnabled": true,
        "query": "strong",
        "conditions": [
            {
                "self": {
                    "condition": "length.to.be.below",
                    "args": 5 //Override default rule condition
                },
                "error": "There are more than 5 <strong> tag in HTML"
            }
        ]
    },
    "custom": { //define custom rule
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
                "error": "<head> without <meta name='robots' ... /> tag"
            }
        ]
    }
}, "console");
parser.parseFile("home.html");


```

#### Development

Copy git repository and run:

```bash
npm install
```

This should setup development environment.

Once satisfied with code changes, update tests and run:

```bash
npm test
```

To update the documentation, edit jsDoc comments and run:

```bash
npm run-script doc
```

#### License

MIT


