/**
 * @license Copyright (c) 2011 Cello Software, LLC.
 * All rights reserved.
 * Available via the new BSD License.
 */
/*jshint
	bitwise: false, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, maxlen: 100,
	newcap: true, noarg: true, noempty: true, onevar: true, passfail: false, strict: true,
	undef: true, white: true
*/
/*global define: false, require: false */

define([
	'dojo/_base/array',
	'compose',
	'lang',
	'./Commissioner',
	'./Event',
	'./Router'
], function (d, compose, lang, Commissioner, Event, Router) {
	'use strict';
	return compose(function NavigationFiber() {
		this._listeners = [];
		this.router = new Router();
	}, {
		id: 'Navigation Fiber',

		init: function (kernel) {
			var fiber = this,
				router = fiber.router;

			fiber.kernel = kernel;
			// XXX: need a way to determine if another fiber is already installed because
			// navigation has a dependency on messaging.
			// could install messaging from here if we knew it wasn't installed yet

			// add a component to handle navigation events
			kernel.addComponentModel({
				id: '__navigator__',
				listen: Event,
				module: router,
				dispatch: true
			});

			fiber._listeners.push(kernel.modelRegistry.on('modelAdded', function (model) {
				var navigator = {},
					navigateProp = model.navigate === true ? 'navigate' : model.navigate;

				// see if the model claims to be a router
				if (model.route || model.route === '') {
					model.addCommissioner(new Commissioner(model, router));
				}

				// see if the model would like to be a navigation dispatcher
				if (navigateProp) {
					navigator[navigateProp] = lang.hitch(fiber, 'navigate');
					model.addMixin(navigator);
				}
			}));
		},

		navigate: function (target) {
			return this.kernel.resolve('__navigator__').then(function (navigator) {
				return navigator.dispatch(new Event(target));
			});
		},

		terminate: function () {
			// stop all the listeners
			d.forEach(this._listeners, function (listener) {
				listener.remove();
			});
		}
	});
});
