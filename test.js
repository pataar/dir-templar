var templar = require('./main');

templar(['./tests/input', './tests/input2'], {name: "joey"}, './tests/output').then(function(){
	console.log('done')
});