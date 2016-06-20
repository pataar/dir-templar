var _ = require('lodash'),
    fs = require('fs-extra'),
    path = require('path');

/**
 * Makes a relative path absolute
 * @param dir input dir
 * @returns {*} output dir
 */
var parsePath = function(dir) {
    return path.normalize(path.isAbsolute(dir) ? dir : path.resolve(dir));
};

var replaceFile = function(input, data, output) {
    return new Promise(function(resolve, reject) {
        fs.readFile(input, function(err, content) {
            if (err) {
                reject(err);
            }

            fs.outputFile(output, _.template(content)(data), function(err) {
                if (err) {
                    reject(err);
                }

                resolve(output);
            });
        });
    });
};



/**
 * Parses a single directory
 * @param input input directory
 * @param templateData lodash template data
 * @param output output directory
 * @param walkFn function to execute each time a file gets replaced
 * @returns {Promise}
 */
var templarWalker = function(input, templateData, output, walkFn) {


    return new Promise(function(resolve, reject) {
        var files = {};
        if(fs.existsSync(input)){
            if (fs.lstatSync(input).isDirectory()) {
                //create correct paths (absolute paths)
                input = parsePath(input);
                output = parsePath(output);

                fs.walk(input).on('data', function(item) {
                    if (item.stats.isFile()) {
                        var itemPath = parsePath(item.path),
                            outputPath = itemPath.replace(input, output + path.sep);

                        if (typeof walkFn === 'function') {
                            outputPath = walkFn(outputPath) || outputPath;
                        } else if (walkFn) {
                            reject("The given walk function is not a function");
                        }

                        files[item.stats.ino] = {
                            input: itemPath,
                            output: outputPath
                        };
                    }
                }).on('end', function() {
                    var counter = 0,
                        parsedPaths = [],
                        length = Object.keys(files).length;

                    for (var i = 0; i < length; i++) {
                        let current = files[Object.keys(files)[i]];

                        replaceFile(current.input, templateData, current.output).then(function(outputPath) {
                            parsedPaths.push(outputPath);
                            counter++;
                            if (counter == length) {
                                resolve(parsedPaths);
                            }
                        }, reject);
                    }
                });
            } else {
                if(path.win32.basename(output).indexOf('.') == -1){
                    try {
                        var stat = fs.lstatSync(output);
                        if(stat.isDirectory(output)){
                                output += path.win32.basename(input);
                        }
                    } catch(e){
                        if(e.code !== 'ENOENT'){
                            //Something went wrong, and it's not expected
                            reject(e);
                        } else if(output.endsWith('/') || output.endsWith('\\')){
                                //file does not exist. Check if it's meant to be a directory.
                                output += path.win32.basename(input);
                        }
                    }
                }
                //parse the file
                replaceFile(parsePath(input), templateData, parsePath(output)).then(resolve, reject);
            }
        } else {
            //input does not exist. skipping.
            resolve([]);
        }
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
var templar = function(input, templateData, output, walkFn) {
    if (_.isArray(input)) {
        var queue = [];
        input.forEach(function(item) {
            queue.push(templarWalker(item, templateData || {}, output, walkFn));
        });
        return Promise.all(queue);
    } else if (_.isString(input)) {
        return templarWalker(input, templateData || {}, output, walkFn);
    } else {
        return Promise.reject("Incorrect input type given. string|array only.")
    }
};

module.exports = templar;
