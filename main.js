var _         = require('lodash'),
    fs        = require('fs-extra'),
    path      = require('path'),
    writefile = require('writefile'),
    logar     = require('logar')('templar');

var parsePath = function (dir) {
	return path.isAbsolute(dir) ? dir : path.resolve(dir)
};

var templarWalker = function (input, templateData, output) {
	input = parsePath(input);
	output = parsePath(output);
	return new Promise(function (resolve, reject) {
		var files = {};
		fs.walk(input).on('data', function (item) {
			if (item.stats.isFile()) {
				var itemPath = parsePath(item.path);
				files[item.stats.ino] = {
					input:  itemPath,
					output: itemPath.replace(input, output)
				};
			}
		}).on('end', function () {
			var counter = 0;
			var length = Object.keys(files).length;
			for (var i = 0; i < length; i++) {
				let current = files[Object.keys(files)[i]];
				fs.readFile(current.input, function (err, content) {
					if (err) {
						reject(err);
					}
					writefile(current.output, _.template(content)(templateData), function (err) {
						if (err) {
							reject(err);
						}
						counter++;
						if (counter == length) {
							resolve();
						}
					});

				});
			}
		});
	});
};

var templar = function (input, templateData, output) {
	if (_.isArray(input)) {
		var queue = [];
		input.forEach(function (item) {
			queue.push(templarWalker(item, templateData, output));
		});
		return Promise.all(queue);
	} else {
		return templarWalker(input, templateData, output);
	}
};

module.exports = templar;