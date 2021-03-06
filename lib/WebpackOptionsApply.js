/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const OptionsApply = require("./OptionsApply");

const JavascriptModulesPlugin = require("./JavascriptModulesPlugin");
const JsonModulesPlugin = require("./JsonModulesPlugin");
const WebAssemblyModulesPlugin = require("./wasm/WebAssemblyModulesPlugin");

const EvalDevToolModulePlugin = require("./EvalDevToolModulePlugin");
const EvalSourceMapDevToolPlugin = require("./EvalSourceMapDevToolPlugin");
const FunctionModulePlugin = require("./FunctionModulePlugin");
const LoaderTargetPlugin = require("./LoaderTargetPlugin");
const SourceMapDevToolPlugin = require("./SourceMapDevToolPlugin");

const EntryOptionPlugin = require("./EntryOptionPlugin");
const RecordIdsPlugin = require("./RecordIdsPlugin");

const RuntimePlugin = require("./RuntimePlugin");

const APIPlugin = require("./APIPlugin");
const CompatibilityPlugin = require("./CompatibilityPlugin");
const ConstPlugin = require("./ConstPlugin");
const NodeStuffPlugin = require("./NodeStuffPlugin");
const RequireJsStuffPlugin = require("./RequireJsStuffPlugin");

const TemplatedPathPlugin = require("./TemplatedPathPlugin");
const UseStrictPlugin = require("./UseStrictPlugin");
const WarnCaseSensitiveModulesPlugin = require("./WarnCaseSensitiveModulesPlugin");

const ResolverCachePlugin = require("./cache/ResolverCachePlugin");

const AMDPlugin = require("./dependencies/AMDPlugin");
const CommonJsPlugin = require("./dependencies/CommonJsPlugin");
const HarmonyModulesPlugin = require("./dependencies/HarmonyModulesPlugin");
const ImportPlugin = require("./dependencies/ImportPlugin");
const LoaderPlugin = require("./dependencies/LoaderPlugin");
const RequireContextPlugin = require("./dependencies/RequireContextPlugin");
const RequireEnsurePlugin = require("./dependencies/RequireEnsurePlugin");
const RequireIncludePlugin = require("./dependencies/RequireIncludePlugin");
const SystemPlugin = require("./dependencies/SystemPlugin");

const WarnDeprecatedOptionPlugin = require("./WarnDeprecatedOptionPlugin");
const WarnNoModeSetPlugin = require("./WarnNoModeSetPlugin");

const DeterministicChunkIdsPlugin = require("./ids/DeterministicChunkIdsPlugin");
const DeterministicModuleIdsPlugin = require("./ids/DeterministicModuleIdsPlugin");
const HashedModuleIdsPlugin = require("./ids/HashedModuleIdsPlugin");
const NamedChunkIdsPlugin = require("./ids/NamedChunkIdsPlugin");
const NamedModuleIdsPlugin = require("./ids/NamedModuleIdsPlugin");
const NaturalChunkIdsPlugin = require("./ids/NaturalChunkIdsPlugin");
const NaturalModuleIdsPlugin = require("./ids/NaturalModuleIdsPlugin");
const OccurrenceChunkIdsPlugin = require("./ids/OccurrenceChunkIdsPlugin");
const OccurrenceModuleIdsPlugin = require("./ids/OccurrenceModuleIdsPlugin");

const DefinePlugin = require("./DefinePlugin");
const FlagDependencyExportsPlugin = require("./FlagDependencyExportsPlugin");
const FlagDependencyUsagePlugin = require("./FlagDependencyUsagePlugin");
const NoEmitOnErrorsPlugin = require("./NoEmitOnErrorsPlugin");
const EnsureChunkConditionsPlugin = require("./optimize/EnsureChunkConditionsPlugin");
const FlagIncludedChunksPlugin = require("./optimize/FlagIncludedChunksPlugin");
const MergeDuplicateChunksPlugin = require("./optimize/MergeDuplicateChunksPlugin");
const ModuleConcatenationPlugin = require("./optimize/ModuleConcatenationPlugin");
const RemoveEmptyChunksPlugin = require("./optimize/RemoveEmptyChunksPlugin");
const RemoveParentModulesPlugin = require("./optimize/RemoveParentModulesPlugin");
const RuntimeChunkPlugin = require("./optimize/RuntimeChunkPlugin");
const SideEffectsFlagPlugin = require("./optimize/SideEffectsFlagPlugin");
const SplitChunksPlugin = require("./optimize/SplitChunksPlugin");
const SizeLimitsPlugin = require("./performance/SizeLimitsPlugin");
const WasmFinalizeExportsPlugin = require("./wasm/WasmFinalizeExportsPlugin");

const DefaultStatsFactoryPlugin = require("./stats/DefaultStatsFactoryPlugin");
const DefaultStatsPresetPlugin = require("./stats/DefaultStatsPresetPlugin");
const DefaultStatsPrinterPlugin = require("./stats/DefaultStatsPrinterPlugin");

/** @typedef {import("../declarations/WebpackOptions").WebpackOptions} WebpackOptions */
/** @typedef {import("./Compiler")} Compiler */

class WebpackOptionsApply extends OptionsApply {
	constructor() {
		super();
	}

	/**
	 * @param {WebpackOptions} options options object
	 * @param {Compiler} compiler compiler object
	 * @returns {WebpackOptions} options object
	 */
	process(options, compiler) {
		compiler.outputPath = options.output.path;
		compiler.recordsInputPath = options.recordsInputPath || options.recordsPath;
		compiler.recordsOutputPath =
			options.recordsOutputPath || options.recordsPath;
		compiler.name = options.name;
		if (typeof options.target === "string") {
			switch (options.target) {
				case "web": {
					const JsonpTemplatePlugin = require("./web/JsonpTemplatePlugin");
					const FetchCompileWasmPlugin = require("./web/FetchCompileWasmPlugin");
					const NodeSourcePlugin = require("./node/NodeSourcePlugin");
					new JsonpTemplatePlugin().apply(compiler);
					new FetchCompileWasmPlugin({
						mangleImports: options.optimization.mangleWasmImports
					}).apply(compiler);
					new FunctionModulePlugin().apply(compiler);
					new NodeSourcePlugin(options.node).apply(compiler);
					new LoaderTargetPlugin(options.target).apply(compiler);
					break;
				}
				case "webworker": {
					const WebWorkerTemplatePlugin = require("./webworker/WebWorkerTemplatePlugin");
					const FetchCompileWasmPlugin = require("./web/FetchCompileWasmPlugin");
					const NodeSourcePlugin = require("./node/NodeSourcePlugin");
					const StartupChunkDependenciesPlugin = require("./runtime/StartupChunkDependenciesPlugin");
					new WebWorkerTemplatePlugin().apply(compiler);
					new FetchCompileWasmPlugin({
						mangleImports: options.optimization.mangleWasmImports
					}).apply(compiler);
					new FunctionModulePlugin().apply(compiler);
					new NodeSourcePlugin(options.node).apply(compiler);
					new LoaderTargetPlugin(options.target).apply(compiler);
					new StartupChunkDependenciesPlugin().apply(compiler);
					break;
				}
				case "node":
				case "async-node": {
					const NodeTemplatePlugin = require("./node/NodeTemplatePlugin");
					const ReadFileCompileWasmPlugin = require("./node/ReadFileCompileWasmPlugin");
					const NodeTargetPlugin = require("./node/NodeTargetPlugin");
					const StartupChunkDependenciesPlugin = require("./runtime/StartupChunkDependenciesPlugin");
					new NodeTemplatePlugin({
						asyncChunkLoading: options.target === "async-node"
					}).apply(compiler);
					new ReadFileCompileWasmPlugin({
						mangleImports: options.optimization.mangleWasmImports
					}).apply(compiler);
					new FunctionModulePlugin().apply(compiler);
					new NodeTargetPlugin().apply(compiler);
					new LoaderTargetPlugin("node").apply(compiler);
					new StartupChunkDependenciesPlugin().apply(compiler);
					break;
				}
				case "node-webkit": {
					const JsonpTemplatePlugin = require("./web/JsonpTemplatePlugin");
					const NodeTargetPlugin = require("./node/NodeTargetPlugin");
					const ExternalsPlugin = require("./ExternalsPlugin");
					const StartupChunkDependenciesPlugin = require("./runtime/StartupChunkDependenciesPlugin");
					new JsonpTemplatePlugin().apply(compiler);
					new FunctionModulePlugin().apply(compiler);
					new NodeTargetPlugin().apply(compiler);
					new ExternalsPlugin("commonjs", "nw.gui").apply(compiler);
					new LoaderTargetPlugin(options.target).apply(compiler);
					new StartupChunkDependenciesPlugin().apply(compiler);
					break;
				}
				case "electron-main": {
					const NodeTemplatePlugin = require("./node/NodeTemplatePlugin");
					const NodeTargetPlugin = require("./node/NodeTargetPlugin");
					const ExternalsPlugin = require("./ExternalsPlugin");
					const StartupChunkDependenciesPlugin = require("./runtime/StartupChunkDependenciesPlugin");
					new NodeTemplatePlugin({
						asyncChunkLoading: true
					}).apply(compiler);
					new FunctionModulePlugin().apply(compiler);
					new NodeTargetPlugin().apply(compiler);
					new ExternalsPlugin("commonjs", [
						"app",
						"auto-updater",
						"browser-window",
						"clipboard",
						"content-tracing",
						"crash-reporter",
						"dialog",
						"electron",
						"global-shortcut",
						"ipc",
						"ipc-main",
						"menu",
						"menu-item",
						"native-image",
						"original-fs",
						"power-monitor",
						"power-save-blocker",
						"protocol",
						"screen",
						"session",
						"shell",
						"tray",
						"web-contents"
					]).apply(compiler);
					new LoaderTargetPlugin(options.target).apply(compiler);
					new StartupChunkDependenciesPlugin().apply(compiler);
					break;
				}
				case "electron-renderer": {
					const JsonpTemplatePlugin = require("./web/JsonpTemplatePlugin");
					const FetchCompileWasmPlugin = require("./web/FetchCompileWasmPlugin");
					const NodeTargetPlugin = require("./node/NodeTargetPlugin");
					const ExternalsPlugin = require("./ExternalsPlugin");
					new JsonpTemplatePlugin().apply(compiler);
					new FetchCompileWasmPlugin({
						mangleImports: options.optimization.mangleWasmImports
					}).apply(compiler);
					new FunctionModulePlugin().apply(compiler);
					new NodeTargetPlugin().apply(compiler);
					new ExternalsPlugin("commonjs", [
						"clipboard",
						"crash-reporter",
						"desktop-capturer",
						"electron",
						"ipc",
						"ipc-renderer",
						"native-image",
						"original-fs",
						"remote",
						"screen",
						"shell",
						"web-frame"
					]).apply(compiler);
					new LoaderTargetPlugin(options.target).apply(compiler);
					break;
				}
				default:
					throw new Error("Unsupported target '" + options.target + "'.");
			}
		}
		// @ts-ignore This is always true, which is good this way
		else if (options.target !== false) {
			options.target(compiler);
		} else {
			throw new Error("Unsupported target '" + options.target + "'.");
		}

		if (options.output.library || options.output.libraryTarget !== "var") {
			const LibraryTemplatePlugin = require("./LibraryTemplatePlugin");
			new LibraryTemplatePlugin(
				options.output.library,
				options.output.libraryTarget,
				options.output.umdNamedDefine,
				options.output.auxiliaryComment || "",
				options.output.libraryExport
			).apply(compiler);
		}
		if (options.externals) {
			const ExternalsPlugin = require("./ExternalsPlugin");
			new ExternalsPlugin(
				options.output.libraryTarget,
				options.externals
			).apply(compiler);
		}

		if (
			options.devtool &&
			(options.devtool.includes("sourcemap") ||
				options.devtool.includes("source-map"))
		) {
			const hidden = options.devtool.includes("hidden");
			const inline = options.devtool.includes("inline");
			const evalWrapped = options.devtool.includes("eval");
			const cheap = options.devtool.includes("cheap");
			const moduleMaps = options.devtool.includes("module");
			const noSources = options.devtool.includes("nosources");
			const legacy = options.devtool.includes("@");
			const modern = options.devtool.includes("#");
			const comment =
				legacy && modern
					? "\n/*\n//@ source" +
					  "MappingURL=[url]\n//# source" +
					  "MappingURL=[url]\n*/"
					: legacy
						? "\n/*\n//@ source" + "MappingURL=[url]\n*/"
						: modern
							? "\n//# source" + "MappingURL=[url]"
							: null;
			const Plugin = evalWrapped
				? EvalSourceMapDevToolPlugin
				: SourceMapDevToolPlugin;
			new Plugin({
				filename: inline ? null : options.output.sourceMapFilename,
				moduleFilenameTemplate: options.output.devtoolModuleFilenameTemplate,
				fallbackModuleFilenameTemplate:
					options.output.devtoolFallbackModuleFilenameTemplate,
				append: hidden ? false : comment,
				module: moduleMaps ? true : cheap ? false : true,
				columns: cheap ? false : true,
				noSources: noSources,
				namespace: options.output.devtoolNamespace
			}).apply(compiler);
		} else if (options.devtool && options.devtool.includes("eval")) {
			const legacy = options.devtool.includes("@");
			const modern = options.devtool.includes("#");
			const comment =
				legacy && modern
					? "\n//@ sourceURL=[url]\n//# sourceURL=[url]"
					: legacy
						? "\n//@ sourceURL=[url]"
						: modern
							? "\n//# sourceURL=[url]"
							: null;
			new EvalDevToolModulePlugin({
				sourceUrlComment: comment,
				moduleFilenameTemplate: options.output.devtoolModuleFilenameTemplate,
				namespace: options.output.devtoolNamespace
			}).apply(compiler);
		}

		new JavascriptModulesPlugin().apply(compiler);
		new JsonModulesPlugin().apply(compiler);
		new WebAssemblyModulesPlugin({
			mangleImports: options.optimization.mangleWasmImports
		}).apply(compiler);

		new EntryOptionPlugin().apply(compiler);
		compiler.hooks.entryOption.call(options.context, options.entry);

		new RuntimePlugin().apply(compiler);

		new CompatibilityPlugin().apply(compiler);
		new HarmonyModulesPlugin(options.module).apply(compiler);
		new AMDPlugin(options.module, options.amd || {}).apply(compiler);
		new CommonJsPlugin(options.module).apply(compiler);
		new LoaderPlugin().apply(compiler);
		new NodeStuffPlugin(options.node).apply(compiler);
		new RequireJsStuffPlugin().apply(compiler);
		new APIPlugin().apply(compiler);
		new ConstPlugin().apply(compiler);
		new UseStrictPlugin().apply(compiler);
		new RequireIncludePlugin().apply(compiler);
		new RequireEnsurePlugin().apply(compiler);
		new RequireContextPlugin(
			options.resolve.modules,
			options.resolve.extensions,
			options.resolve.mainFiles
		).apply(compiler);
		new ImportPlugin(options.module).apply(compiler);
		new SystemPlugin(options.module).apply(compiler);

		new DefaultStatsFactoryPlugin().apply(compiler);
		new DefaultStatsPresetPlugin().apply(compiler);
		new DefaultStatsPrinterPlugin().apply(compiler);

		if (typeof options.mode !== "string") {
			new WarnNoModeSetPlugin().apply(compiler);
		}

		new EnsureChunkConditionsPlugin().apply(compiler);
		if (options.optimization.removeAvailableModules) {
			new RemoveParentModulesPlugin().apply(compiler);
		}
		if (options.optimization.removeEmptyChunks) {
			new RemoveEmptyChunksPlugin().apply(compiler);
		}
		if (options.optimization.mergeDuplicateChunks) {
			new MergeDuplicateChunksPlugin().apply(compiler);
		}
		if (options.optimization.flagIncludedChunks) {
			new FlagIncludedChunksPlugin().apply(compiler);
		}
		if (options.optimization.sideEffects) {
			new SideEffectsFlagPlugin().apply(compiler);
		}
		if (options.optimization.providedExports) {
			new FlagDependencyExportsPlugin().apply(compiler);
		}
		if (options.optimization.usedExports) {
			new FlagDependencyUsagePlugin().apply(compiler);
		}
		if (options.optimization.concatenateModules) {
			new ModuleConcatenationPlugin().apply(compiler);
		}
		if (options.optimization.splitChunks) {
			new SplitChunksPlugin(options.optimization.splitChunks).apply(compiler);
		}
		if (options.optimization.runtimeChunk) {
			new RuntimeChunkPlugin(options.optimization.runtimeChunk).apply(compiler);
		}
		if (options.optimization.noEmitOnErrors) {
			new NoEmitOnErrorsPlugin().apply(compiler);
		}
		if (options.optimization.checkWasmTypes) {
			new WasmFinalizeExportsPlugin().apply(compiler);
		}
		const moduleIds = options.optimization.moduleIds;
		if (moduleIds) {
			switch (moduleIds) {
				case "natural":
					new NaturalModuleIdsPlugin().apply(compiler);
					break;
				case "named":
					new NamedModuleIdsPlugin().apply(compiler);
					break;
				case "hashed":
					new WarnDeprecatedOptionPlugin(
						"optimization.moduleIds",
						"hashed",
						"deterministic"
					).apply(compiler);
					new HashedModuleIdsPlugin().apply(compiler);
					break;
				case "deterministic":
					new DeterministicModuleIdsPlugin().apply(compiler);
					break;
				case "size":
					new OccurrenceModuleIdsPlugin({
						prioritiseInitial: true
					}).apply(compiler);
					break;
				default:
					throw new Error(
						`webpack bug: moduleIds: ${moduleIds} is not implemented`
					);
			}
		}
		const chunkIds = options.optimization.chunkIds;
		if (chunkIds) {
			switch (chunkIds) {
				case "natural":
					new NaturalChunkIdsPlugin().apply(compiler);
					break;
				case "named":
					new NamedChunkIdsPlugin().apply(compiler);
					break;
				case "deterministic":
					new DeterministicChunkIdsPlugin().apply(compiler);
					break;
				case "size":
					new OccurrenceChunkIdsPlugin({
						prioritiseInitial: true
					}).apply(compiler);
					break;
				case "total-size":
					new OccurrenceChunkIdsPlugin({
						prioritiseInitial: false
					}).apply(compiler);
					break;
				default:
					throw new Error(
						`webpack bug: chunkIds: ${chunkIds} is not implemented`
					);
			}
		}
		if (options.optimization.nodeEnv) {
			new DefinePlugin({
				"process.env.NODE_ENV": JSON.stringify(options.optimization.nodeEnv)
			}).apply(compiler);
		}
		if (options.optimization.minimize) {
			for (const minimizer of options.optimization.minimizer) {
				if (typeof minimizer === "function") {
					minimizer.apply(compiler);
				} else {
					minimizer.apply(compiler);
				}
			}
		}

		if (options.performance) {
			new SizeLimitsPlugin(options.performance).apply(compiler);
		}

		new TemplatedPathPlugin().apply(compiler);

		new RecordIdsPlugin({
			portableIds: options.optimization.portableRecords
		}).apply(compiler);

		new WarnCaseSensitiveModulesPlugin().apply(compiler);

		if (options.cache && typeof options.cache === "object") {
			switch (options.cache.type) {
				case "memory": {
					const MemoryCachePlugin = require("./cache/MemoryCachePlugin");
					new MemoryCachePlugin().apply(compiler);
					break;
				}
				case "filesystem": {
					const MemoryCachePlugin = require("./cache/MemoryCachePlugin");
					new MemoryCachePlugin().apply(compiler);
					const FileCachePlugin = require("./cache/FileCachePlugin");
					new FileCachePlugin(options.cache).apply(compiler);
					break;
				}
				default:
					// @ts-ignore never is expected here
					throw new Error(`Unknown cache type ${options.cache.type}`);
			}
		}
		new ResolverCachePlugin().apply(compiler);

		compiler.hooks.afterPlugins.call(compiler);
		if (!compiler.inputFileSystem) {
			throw new Error("No input filesystem provided");
		}
		compiler.resolverFactory.hooks.resolveOptions
			.for("normal")
			.tap("WebpackOptionsApply", resolveOptions => {
				return Object.assign(
					{
						fileSystem: compiler.inputFileSystem
					},
					options.resolve,
					resolveOptions
				);
			});
		compiler.resolverFactory.hooks.resolveOptions
			.for("context")
			.tap("WebpackOptionsApply", resolveOptions => {
				return Object.assign(
					{
						fileSystem: compiler.inputFileSystem,
						resolveToContext: true
					},
					options.resolve,
					resolveOptions
				);
			});
		compiler.resolverFactory.hooks.resolveOptions
			.for("loader")
			.tap("WebpackOptionsApply", resolveOptions => {
				return Object.assign(
					{
						fileSystem: compiler.inputFileSystem
					},
					options.resolveLoader,
					resolveOptions
				);
			});
		compiler.hooks.afterResolvers.call(compiler);
		return options;
	}
}

module.exports = WebpackOptionsApply;
