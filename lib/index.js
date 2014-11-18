'use strict';

// Based on https://github.com/hapijs/hapi-auth-basic/blob/master/lib/index.js

var Boom = require('boom');
var Hoek = require('hoek');

var internals = {};

exports.register = function (plugin, options, next) {
	plugin.auth.scheme('bearerAuth', internals.implementation);
	//TODO log if node env = test
	console.log('bearerAuth plugin registered');
	return next();
};

exports.register.attributes = {
	pkg: require('../package.json')
};

internals.implementation = function (server, options) {

	Hoek.assert(options, 'Missing bearerAuthentication strategy options');
	Hoek.assert(typeof options.validateFunction === 'function', 'options.validateFunc must be a valid function in bearerAuthentication scheme');

	var settings = Hoek.clone(options);

	var scheme = {
		authenticate: function (request, reply) {
			if (!request.headers.authorization || request.headers.authorization === null || request.headers.authorization === undefined) {
				reply(Boom.unauthorized('NO_AUTH_HEADER'));
			} else {
				var headerParts = request.headers.authorization.split(' ');

				if (headerParts[0].toLowerCase !== 'bearer') {
					return reply(Boom.notAcceptable('Token should be given in the Authorization header in "Bearer [token]" form. Example: "Auhtorization: Bearer azertyuiop0123"'));
				}

				// use provided validate function to return 
				settings.validateFunction(headerParts[1], function (err, isValid, result) {
					if (err || !isValid || !result) {
						return reply(Boom.unauthorized('UNAUTHORIZED_INVALID_TOKEN cause: ' + err));
					}

					result.token = headerParts[1];
					return reply(null, {
						credentials: result
					});
				});
			}
		}
	};

	return scheme;
};