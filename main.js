var _         = require('lodash'),
    fs        = require('fs-extra'),
    path      = require('path'),
    writefile = require('writefile')

/**
 * Makes a relative path absolute
 * @param dir input dir
 * @returns {*} output dir
 */
var parsePath = function (dir) {
	return path.normalize(path.isAbsolute(dir) ? dir : path.resolve(dir));
};

/**
 * Parses a single directory
 * @param input input directory
 * @param templateData lodash template data
 * @param output output directory
 * @param walkFn function to execute each time a file gets replaced
 * @returns {Promise}
 */
var templarWalker = function (input, templateData, output, walkFn) {
	input = parsePath(input);
	output = parsePath(output);
	return new Promise(function (resolve, reject) {
		var files = {};
		fs.walk(input).on('data', function (item) {
			if (item.stats.isFile()) {
				var itemPath = parsePath(item.path),
					outputPath = itemPath.replace(input, output + path.sep);
				
				if(typeof walkFn === 'function') {
					outputPath = walkFn(outputPath) || outputPath;
				}
				
				files[item.stats.ino] = {
					input:  itemPath,
					output: outputPath
				};
			}
		}).on('end', function () {
			var counter = 0,
			    parsedPaths = [],
			    length = Object.keys(files).length;

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
						parsedPaths.push(current.output);

						counter++;
						if (counter == length) {
							resolve(parsedPaths);
						}
					});

				});
			}
		});
	});
};

/**
 *  Can handle multiple directories
 * @param {string|array} input directories
 * @param templateData replacement data
 * @param output output directory
 * @param walkFn function to execute each time a file gets replaced
 * @returns {Promise}
 */
var templar = function (input, templateData, output, walkFn) {
	if (_.isArray(input)) {
		var queue = [];
		input.forEach(function (item) {
			queue.push(templarWalker(item, templateData, output, walkFn));
		});
		return Promise.all(queue);
	} else {
		return templarWalker(input, templateData, output, walkFn);
	}
};

module.exports = templar;