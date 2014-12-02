/**
 * This is the default application build profile used by the boilerplate. While it looks similar, this build profile
 * is different from the package build profile at `app/package.js` in the following ways:
 *
 * 1. you can have multiple application build profiles (e.g. one for desktop, one for tablet, etc.), but only one
 *    package build profile;
 * 2. the package build profile only configures the `resourceTags` for the files in the package, whereas the
 *    application build profile tells the build system how to build the entire application.
 *
 * Look to `util/build/buildControlDefault.js` for more information on available options and their default values.
 */

var profile = {
	// `basePath` is relative to the directory containing this profile file; in this case, it is being set to the
	// src/ directory, which is the same place as the `baseUrl` directory in the loader configuration. (If you change
	// this, you will also need to update run.js.)
	basePath: '../src/',

	// This is the directory within the release directory where built packages will be placed. The release directory
	// itself is defined by `build.sh`. You should probably not use this; it is a legacy option dating back to Dojo
	// 0.4.
	// If you do use this, you will need to update build.sh, too.
	// releaseName: '',

	// Builds a new release.
	action: 'release',

	// Strips all comments and whitespace from CSS files and inlines @imports where possible.
	cssOptimize: 'comments',

	// Excludes tests, demos, and original template files from being included in the built version.
	mini: true,

	// Uses Closure Compiler as the JavaScript minifier. This can also be set to "shrinksafe" to use ShrinkSafe,
	// though ShrinkSafe is deprecated and not recommended.
	// This option defaults to "" (no compression) if not provided.
	optimize: 'closure',

	// We're building layers, so we need to set the minifier to use for those, too.
	// This defaults to "shrinksafe" if not provided.
	layerOptimize: 'closure',

	// Strips all calls to console functions within the code. You can also set this to "warn" to strip everything
	// but console.error, and any other truthy value to strip everything but console.warn and console.error.
	// This defaults to "normal" (strip all but warn and error) if not provided.
	stripConsole: 'all',

	// The default selector engine is not included by default in a dojo.js build in order to make mobile builds
	// smaller. We add it back here to avoid that extra HTTP request. There is also a "lite" selector available; if
	// you use that, you will need to set the `selectorEngine` property in `app/run.js`, too. (The "lite" engine is
	// only suitable if you are not supporting IE7 and earlier.)
	selectorEngine: 'acme',

	// Builds can be split into multiple different JavaScript files called "layers". This allows applications to
	// defer loading large sections of code until they are actually required while still allowing multiple modules to
	// be compiled into a single file.
	layers: {
		// This is the main loader module. It is a little special because it is treated like an AMD module even though
		// it is actually just plain JavaScript. There is some extra magic in the build system specifically for this
		// module ID.
		'dojo/dojo': {
			// In addition to the loader `dojo/dojo` and the loader configuration file `app/run`, we are also including
			// the main application `app/main` and the `dojo/i18n` and `dojo/domReady` modules because, while they are
			// all conditional dependencies in `app/main`, we do not want to have to make extra HTTP requests for such
			// tiny files.
			include: [
				'dojo/i18n',
				'dojo/main',
				'dojo/ready',
				'dojo/domReady',
				"dojo/dom-construct",
				"dojo/_base/NodeList",
				"dojo/_base/browser",
				"dojox/html/entities",
				'dijit/layout/BorderContainer',
				'dijit/layout/ContentPane',
				'dojox/layout/ExpandoPane',
				'dijit/layout/LayoutContainer',
                'dijit/form/Form',
				'dijit/form/TextBox',
				'dijit/form/Button',
				"dijit/MenuBar",
				"dijit/PopupMenuBarItem",
				"dijit/Menu",
				"dijit/MenuItem",
				"dijit/DropDownMenu",
				"dijit/Toolbar",
				"dijit/Dialog",
				"dijit/layout/TabContainer",
				"dijit/form/RadioButton",
				"dijit/form/ToggleButton",
				"dijit/form/Select",
				"dijit/form/HorizontalSlider",
				"dijit/form/NumberTextBox",
				"dijit/form/NumberSpinner",
				"dijit/form/CheckBox",
				"dojox/widget/ColorPicker",
				"dijit/form/DropDownButton",
				"dijit/TooltipDialog"
			],

			// By default, the build system will try to include `dojo/main` in the built `dojo/dojo` layer, which adds
			// a bunch of stuff we do not want or need. We want the initial script load to be as small and quick to
			// load as possible, so we configure it as a custom, bootable base.
			boot: true,
			customBase: true
		}
	},

	// Providing hints to the build system allows code to be conditionally removed on a more granular level than
	// simple module dependencies can allow. This is especially useful for creating tiny mobile builds.
	// Keep in mind that dead code removal only happens in minifiers that support it! Currently, only Closure Compiler
	// to the Dojo build system with dead code removal.
	// A documented list of has-flags in use within the toolkit can be found at
	// <http://dojotoolkit.org/reference-guide/dojo/has.html>.
	staticHasFeatures: {
		// The trace & log APIs are used for debugging the loader, so we do not need them in the build.
		'dojo-trace-api': 0,
		'dojo-log-api': 0,

		// This causes normally private loader data to be exposed for debugging. In a release build, we do not need
		// that either.
		'dojo-publish-privates': 0,

		// This application is pure AMD, so get rid of the legacy loader.
		'dojo-sync-loader': 0,

		// `dojo-xhr-factory` relies on `dojo-sync-loader`, which we have removed.
		'dojo-xhr-factory': 0,

		// We are not loading tests in production, so we can get rid of some test sniffing code.
		'dojo-test-sniff': 0
	}
};
