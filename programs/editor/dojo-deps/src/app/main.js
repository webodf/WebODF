/**
 * This file is the application's main JavaScript file. It is listed as a dependency in run.js and will automatically
 * load when run.js loads.
 *
 * Because this file has the special filename `main.js`, and because we've registered the `app` package in run.js,
 * whatever object this module returns can be loaded by other files simply by requiring `app` (instead of `app/main`).
 *
 * Our first dependency is to the `dojo/has` module, which allows us to conditionally execute code based on
 * configuration settings or environmental information. Unlike a normal conditional, these branches can be compiled
 * away by the build system; see `staticHasFeatures` in app.profile.js for more information.
 *
 * Our second dependency is to the special module `require`; this allows us to make additional require calls using
 * module IDs relative to this module within the body of the define callback.
 *
 * In all cases, whatever function is passed to define() is only invoked once, and the returned value is cached.
 *
 * More information about everything described about the loader throughout this file can be found at
 * <http://dojotoolkit.org/reference-guide/loader/amd.html>.
 */
define([ 'dojo/has', 'require', 'app/DojoBundlePlaceholder' ], function (has, require, nls_dojobundle) {
	var app = {};

	/**
	 * This main.js file conditionally executes different code depending upon the host environment it is loaded in.
	 * This is an increasingly common pattern when dealing with applications that run in different environments that
	 * require different functionality (i.e. client/server or desktop/tablet/phone).
	 */
	if (has('host-browser')) {
		/*
		 * This require call's first dependency, `./Dialog`, uses a relative module identifier; you should use this
		 * type of notation for dependencies *within* a package in order to ensure the package is fully portable. It
		 * works like a path, where `./` refers to the current directory and `../` refers to the parent directory. If
		 * you are referring to a module in a *different* package (like `dojo` or `dijit`), you should *not* use a
		 * relative module identifier.
		 *
		 * The second dependency is a plugin dependency; in this case, it is a dependency on the special functionality
		 * of the `dojo/domReady` plugin, which simply waits until the DOM is ready before resolving.
		 * The `!` after the module name indicates you want to use special plugin functionality; if you were to
		 * require just `dojo/domReady`, it would load that module just like any other module, without the special
		 * plugin functionality.
		 */

	}
	else {
		// TODO: Eventually, the Boilerplate will actually have a useful server implementation here :)
		console.log('Hello from the server!');
	}
});
