"use strict";

/* globals describe expect it beforeAll */
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const mkdirp = require("mkdirp");
const rimraf = require("rimraf");
const checkArrayExpectation = require("./checkArrayExpectation");
const createLazyTestEnv = require("./helpers/createLazyTestEnv");
const FakeDocument = require("./helpers/FakeDocument");

const webpack = require("..");
const prepareOptions = require("./helpers/prepareOptions");

describe("ConfigTestCases", () => {
	const casesPath = path.join(__dirname, "configCases");
	let categories = fs.readdirSync(casesPath);

	jest.setTimeout(20000);

	categories = categories.map(cat => {
		return {
			name: cat,
			tests: fs
				.readdirSync(path.join(casesPath, cat))
				.filter(folder => {
					return folder.indexOf("_") < 0;
				})
				.sort()
				.filter(testName => {
					const testDirectory = path.join(casesPath, cat, testName);
					const filterPath = path.join(testDirectory, "test.filter.js");
					if (fs.existsSync(filterPath) && !require(filterPath)()) {
						describe.skip(testName, () => it("filtered"));
						return false;
					}
					return true;
				})
		};
	});
	categories.forEach(category => {
		describe(category.name, () => {
			category.tests.forEach(testName => {
				describe(testName, function() {
					const testDirectory = path.join(casesPath, category.name, testName);
					const outputDirectory = path.join(
						__dirname,
						"js",
						"config",
						category.name,
						testName
					);
					it(
						testName + " should compile",
						() =>
							new Promise((resolve, reject) => {
								const done = err => {
									if (err) return reject(err);
									resolve();
								};
								rimraf.sync(outputDirectory);
								mkdirp.sync(outputDirectory);
								const options = prepareOptions(
									require(path.join(testDirectory, "webpack.config.js")),
									{ testPath: outputDirectory }
								);
								const optionsArr = [].concat(options);
								optionsArr.forEach((options, idx) => {
									if (!options.context) options.context = testDirectory;
									if (!options.mode) options.mode = "production";
									if (!options.optimization) options.optimization = {};
									if (options.optimization.minimize === undefined)
										options.optimization.minimize = false;
									if (!options.entry) options.entry = "./index.js";
									if (!options.target) options.target = "async-node";
									if (!options.output) options.output = {};
									if (!options.output.path)
										options.output.path = outputDirectory;
									if (typeof options.output.pathinfo === "undefined")
										options.output.pathinfo = true;
									if (!options.output.filename)
										options.output.filename = "bundle" + idx + ".js";
								});
								let testConfig = {
									findBundle: function(i, options) {
										const ext = path.extname(options.output.filename);
										if (
											fs.existsSync(
												path.join(options.output.path, "bundle" + i + ext)
											)
										) {
											return "./bundle" + i + ext;
										}
									},
									timeout: 30000
								};
								try {
									// try to load a test file
									testConfig = Object.assign(
										testConfig,
										require(path.join(testDirectory, "test.config.js"))
									);
								} catch (e) {
									// ignored
								}
								if (testConfig.timeout) setDefaultTimeout(testConfig.timeout);

								webpack(options, (err, stats) => {
									if (err) {
										const fakeStats = {
											errors: [
												{
													message: err.message,
													stack: err.stack
												}
											]
										};
										if (
											checkArrayExpectation(
												testDirectory,
												fakeStats,
												"error",
												"Error",
												done
											)
										)
											return;
										// Wait for uncaught errors to occur
										return setTimeout(done, 200);
									}
									const statOptions = {
										preset: "verbose",
										colors: false
									};
									mkdirp.sync(outputDirectory);
									fs.writeFileSync(
										path.join(outputDirectory, "stats.txt"),
										stats.toString(statOptions),
										"utf-8"
									);
									const jsonStats = stats.toJson({
										errorDetails: true
									});
									fs.writeFileSync(
										path.join(outputDirectory, "stats.json"),
										JSON.stringify(jsonStats, null, 2),
										"utf-8"
									);
									if (
										checkArrayExpectation(
											testDirectory,
											jsonStats,
											"error",
											"Error",
											done
										)
									)
										return;
									if (
										checkArrayExpectation(
											testDirectory,
											jsonStats,
											"warning",
											"Warning",
											done
										)
									)
										return;

									const globalContext = {
										console: console,
										expect: expect,
										setTimeout: setTimeout,
										clearTimeout: clearTimeout,
										document: new FakeDocument(),
										location: {
											href: "https://test.cases/path/index.html",
											origin: "https://test.cases",
											toString() {
												return "https://test.cases/path/index.html";
											}
										}
									};

									function _require(currentDirectory, options, module) {
										if (Array.isArray(module) || /^\.\.?\//.test(module)) {
											let fn;
											let content;
											let p;
											if (Array.isArray(module)) {
												p = path.join(currentDirectory, module[0]);
												content = module
													.map(arg => {
														p = path.join(currentDirectory, arg);
														return fs.readFileSync(p, "utf-8");
													})
													.join("\n");
											} else {
												p = path.join(currentDirectory, module);
												content = fs.readFileSync(p, "utf-8");
											}
											if (
												options.target === "web" ||
												options.target === "webworker"
											) {
												fn = vm.runInNewContext(
													"(function(require, module, exports, __dirname, __filename, it, beforeEach, afterEach, expect, jest, window, self) {" +
														'function nsObj(m) { Object.defineProperty(m, Symbol.toStringTag, { value: "Module" }); return m; }' +
														content +
														"\n})",
													globalContext,
													p
												);
											} else {
												fn = vm.runInThisContext(
													"(function(require, module, exports, __dirname, __filename, it, beforeEach, afterEach, expect, jest) {" +
														"global.expect = expect; " +
														'function nsObj(m) { Object.defineProperty(m, Symbol.toStringTag, { value: "Module" }); return m; }' +
														content +
														"\n})",
													p
												);
											}
											const m = {
												exports: {}
											};
											fn.call(
												m.exports,
												_require.bind(null, path.dirname(p), options),
												m,
												m.exports,
												path.dirname(p),
												p,
												_it,
												_beforeEach,
												_afterEach,
												expect,
												jest,
												globalContext,
												globalContext
											);
											return m.exports;
										} else if (
											testConfig.modules &&
											module in testConfig.modules
										) {
											return testConfig.modules[module];
										} else return require(module);
									}
									let filesCount = 0;

									if (testConfig.noTests) return process.nextTick(done);
									const results = [];
									for (let i = 0; i < optionsArr.length; i++) {
										const bundlePath = testConfig.findBundle(i, optionsArr[i]);
										if (bundlePath) {
											filesCount++;
											results.push(_require(outputDirectory, optionsArr[i], bundlePath));
										}
									}
									// give a free pass to compilation that generated an error
									if (
										!jsonStats.errors.length &&
										filesCount !== optionsArr.length
									)
										return done(
											new Error(
												"Should have found at least one bundle file per webpack config"
											)
										);
									Promise.all(results).then(() => {
										if (getNumberOfTests() < filesCount)
											return done(new Error("No tests exported by test case"));
										if (testConfig.afterExecute) testConfig.afterExecute();
										done();
									}).catch(done);
								});
							})
					);

					const {
						it: _it,
						beforeEach: _beforeEach,
						afterEach: _afterEach,
						setDefaultTimeout,
						getNumberOfTests
					} = createLazyTestEnv(jasmine.getEnv(), 10000);
				});
			});
		});
	});
});
