# dir-templar || templar
dir-templar is module that can parse recursive lodash templates and store it on another location
```sh
npm install dir-templar --save
```



## Usage
Templar can be used like this:


Just require the package:
```javascript
var templar = require('dir-templar');
```

#### Parsing
You can use the following syntax to parse templates
```javascript
templar(input templateData, output[, walkFn]);
```


#### Example
```javascript
templar(['./dir1', './dir2'], {name: "My Name"}, './output').then(function(parsedFiles){
		//returns an array of parsed files.
	}, function(error){
		//returns an error when something went wrong
		console.error(error);
	}
);
```

You can also add a walk function. Which will be triggered on each file replace.
```javascript
templar(['./dir1', './dir2'], {name: "My Name"}, './output', function(path) {
        //replace in  path name
        return path.replace(/%replacement%/g, "pathreplacement");
    }).then(function(parsedFiles){
        //returns an array of parsed files.
    }, function(error){
        //returns an error when something went wrong
        console.error(error);
    }
);
```