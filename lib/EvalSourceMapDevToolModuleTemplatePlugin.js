/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const { RawSource } = require("webpack-sources");
const ModuleFilenameHelpers = require("./ModuleFilenameHelpers");
const NormalModule = require("./NormalModule");

/** @typedef {import("webpack-sources").Source} Source */
/** @typedef {import("./ModuleTemplate")} ModuleTemplate */

/** @type {WeakMap<Source, Source>} */
const cache = new WeakMap();

class EvalSourceMapDevToolModuleTemplatePlugin {
	constructor(compilation, options) {
		this.compilation = compilation;
		this.sourceMapComment =
			options.append || "//# sourceURL=[module]\n//# sourceMappingURL=[url]";
		this.moduleFilenameTemplate =
			options.moduleFilenameTemplate ||
			"webpack://[namespace]/[resource-path]?[hash]";
		this.namespace = options.namespace || "";
		this.options = options;
	}

	/**
	 * @param {ModuleTemplate} moduleTemplate the module template
	 * @returns {void}
	 */
	apply(moduleTemplate) {
		const options = this.options;
		const matchModule = ModuleFilenameHelpers.matchObject.bind(
			ModuleFilenameHelpers,
			options
		);
		moduleTemplate.hooks.module.tap(
			"EvalSourceMapDevToolModuleTemplatePlugin",
			(source, m) => {
				const cachedSource = cache.get(source);
				if (cachedSource !== undefined) {
					return cachedSource;
				}

				if (!(m instanceof NormalModule)) {
					return source;
				}

				const module = /** @type {NormalModule} */ (m);

				if (!matchModule(module.resource)) {
					return source;
				}

				const chunkGraph = this.compilation.chunkGraph;

				/** @type {{ [key: string]: TODO; }} */
				let sourceMap;
				let content;
				if (source.sourceAndMap) {
					const sourceAndMap = source.sourceAndMap(options);
					sourceMap = sourceAndMap.map;
					content = sourceAndMap.source;
				} else {
					sourceMap = source.map(options);
					content = source.source();
				}
				if (!sourceMap) {
					return source;
				}

				// Clone (flat) the sourcemap to ensure that the mutations below do not persist.
				sourceMap = Object.keys(sourceMap).reduce((obj, key) => {
					obj[key] = sourceMap[key];
					return obj;
				}, {});
				const modules = sourceMap.sources.map(source => {
					const module = this.compilation.findModule(source);
					return module || source;
				});
				let moduleFilenames = modules.map(module => {
					return ModuleFilenameHelpers.createFilename(
						module,
						{
							moduleFilenameTemplate: this.moduleFilenameTemplate,
							namespace: this.namespace
						},
						{
							requestShortener: moduleTemplate.runtimeTemplate.requestShortener,
							chunkGraph
						}
					);
				});
				moduleFilenames = ModuleFilenameHelpers.replaceDuplicates(
					moduleFilenames,
					(filename, i, n) => {
						for (let j = 0; j < n; j++) filename += "*";
						return filename;
					}
				);
				sourceMap.sources = moduleFilenames;
				sourceMap.sourceRoot = options.sourceRoot || "";
				const moduleId = chunkGraph.getModuleId(module);
				sourceMap.file = `${moduleId}.js`;

				const footer =
					this.sourceMapComment.replace(
						/\[url\]/g,
						`data:application/json;charset=utf-8;base64,${Buffer.from(
							JSON.stringify(sourceMap),
							"utf8"
						).toString("base64")}`
					) + `\n//# sourceURL=webpack-internal:///${moduleId}\n`; // workaround for chrome bug

				const evalSource = new RawSource(
					`eval(${JSON.stringify(content + footer)});`
				);

				cache.set(source, evalSource);

				return evalSource;
			}
		);
		moduleTemplate.hooks.hash.tap(
			"EvalSourceMapDevToolModuleTemplatePlugin",
			hash => {
				hash.update("eval-source-map");
				hash.update("2");
			}
		);
	}
}
module.exports = EvalSourceMapDevToolModuleTemplatePlugin;
