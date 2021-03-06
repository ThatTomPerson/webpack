/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const asyncLib = require("neo-async");
const path = require("path");
const EntryDependency = require("./dependencies/EntryDependency");
const { compareModulesById } = require("./util/comparators");

/** @typedef {import("./Compiler")} Compiler */

/**
 * @typedef {Object} ManifestModuleData
 * @property {string | number} id
 * @property {Object} buildMeta
 * @property {boolean | string[]} exports
 */

class LibManifestPlugin {
	constructor(options) {
		this.options = options;
	}

	/**
	 * @param {Compiler} compiler webpack compiler
	 * @returns {void}
	 */
	apply(compiler) {
		compiler.hooks.emit.tapAsync(
			"LibManifestPlugin",
			(compilation, callback) => {
				const moduleGraph = compilation.moduleGraph;
				asyncLib.forEach(
					Array.from(compilation.chunks),
					(chunk, callback) => {
						if (!chunk.isOnlyInitial()) {
							callback();
							return;
						}
						const chunkGraph = compilation.chunkGraph;
						const targetPath = compilation.getPath(this.options.path, {
							chunk
						});
						const name =
							this.options.name &&
							compilation.getPath(this.options.name, {
								chunk
							});
						const manifest = {
							name,
							type: this.options.type,
							content: Array.from(
								chunkGraph.getOrderedChunkModulesIterable(
									chunk,
									compareModulesById(chunkGraph)
								),
								module => {
									if (
										this.options.entryOnly &&
										!moduleGraph
											.getIncomingConnections(module)
											.some(c => c.dependency instanceof EntryDependency)
									) {
										return;
									}
									const ident = module.libIdent({
										context: this.options.context || compiler.options.context
									});
									if (ident) {
										const providedExports = moduleGraph.getProvidedExports(
											module
										);
										/** @type {ManifestModuleData} */
										const data = {
											id: chunkGraph.getModuleId(module),
											buildMeta: module.buildMeta,
											exports: Array.isArray(providedExports)
												? providedExports
												: undefined
										};
										return {
											ident,
											data
										};
									}
								}
							)
								.filter(Boolean)
								.reduce((obj, item) => {
									obj[item.ident] = item.data;
									return obj;
								}, Object.create(null))
						};
						// Apply formatting to content if format flag is true;
						const manifestContent = this.options.format
							? JSON.stringify(manifest, null, 2)
							: JSON.stringify(manifest);
						const content = Buffer.from(manifestContent, "utf8");
						compiler.outputFileSystem.mkdirp(path.dirname(targetPath), err => {
							if (err) return callback(err);
							compiler.outputFileSystem.writeFile(
								targetPath,
								content,
								callback
							);
						});
					},
					callback
				);
			}
		);
	}
}
module.exports = LibManifestPlugin;
