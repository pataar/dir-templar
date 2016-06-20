var templar = require('./main');

templar(['./tests_io/input', './tests/input2'], {name: "joey"}, './tests_io/output').then(function(){
	console.log('done resursive test')
});

templar('./tests_io/test42.js', {name: "joey"}, './tests_io/output/').then(function(){
	console.log('done 2')
}, function(err){
	console.error(err);
});

//TODO: Write normal unittests
