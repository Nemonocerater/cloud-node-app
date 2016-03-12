'use strict';

var express = require('express');
var crypto = require('crypto');
var bodyParser = require('body-parser');

module.exports = function auth_export(user_manager) {

	var router = express.Router();

	// Automatically parse request body as form data
	router.use(bodyParser.urlencoded({ extended: false }));

	// Set Content-Type for all responses for these routes
	router.use(function (req, res, next){
		res.set('Content-Type', 'text/html');
		next();
	});

	router.get('/', function auth_home(req, res, next) {
		res.render('auth/auth_home.jade', {});
	});

	router.get('/user/create', function user_create_get(req, res, next) {
		renderUserCreate(res);
	});

	function renderUserCreate(res, error) {
		res.render('auth/user_create.jade', {
			error: error
		});
	}

	router.post('/user/create', function user_create_post(req, res, next) {
		var username = req.body.username;
		var password = req.body.password;

		if (username && password) {
			user_manager.insert_user(username, password, function(err, results) {
				if (err) {
					if (err.errno === 1062) {
						renderUserCreate(res, "A user with this username already exists.");
					} else {
						renderError(res, err);
					}
					return;
				}

				res.render('auth/user_create_success.jade', {
					username: username
				});
			});
		} else {
			renderUserCreate(res, "You must supply a username and password");
		}
	});

	function renderError(res, err, message) {
		if (err) {
			console.log (err);
			message = message ? message : err.message;
		} else if (!message) {
			console.log("auth.renderError called without an error");
		}

		res.render('error.jade', {
			error: message,
			err_object: err
		});
	}

	router.get('/login', function login_get(req, res, next) {
		var redirect = req.query.redirect;
		renderLogin(res, redirect);
	});

	function renderLogin(res, redirect, error) {
		res.render('auth/login.jade', {
			redirect: redirect,
			error: error
		});
	}

	router.post('/login', function login_post(req, res, next) {
		var redirect = req.query.redirect;
		var username = req.body.username;
		var password = req.body.password;

		user_manager.login_user(username, password, function (err, username) {
			if (err) {
				renderError(res, err);
			} else if (username !== null) {
				req.session.username = username;
				res.redirect(redirect);
			} else {
				renderLogin(res, redirect, "The username and password that you entered do not match");
			}
		});
	});

	router.get('/logout', function logout(req, res) {
		var redirect = req.query.redirect;

		req.session = null;
		res.render('auth/logout.jade', {
			redirect: redirect
		});
	});

	router.get('/reset/generate/:username', function (req, res) {
		var username = req.params.username;
		if (username === req.session.username) {
			user_manager.generate_reset_hash(username, function(err, reset_hash) {
				res.render('auth/generate_reset_hash.jade', {
					reset_hash: reset_hash
				});
			});
		} else {
			res.render('auth/generate_reset_hash_fail.jade', {
				error: "The username (" + username + ") does not match the currently logged in user (" + req.session.username + ")."
			});
		}
	});

	router.get('/reset/:reset_hash', function reset(req, res) {
		var reset_hash = req.params.reset_hash;

		user_manager.get_reset_hash_username(reset_hash, function get_reset_user(err, username) {
			var error = null;
			if (err) {
				renderError(res, err);
				return;
			}

			req.session.reset_username = username;

			if (req.session.reset_username) {
				renderResetPage(req, res, reset_hash);
				return;
			} else if (error === null) {
				error = "This password reset link has expired or is invalid."
			}

			res.render('auth/reset_fail.jade', {
				error: error
			});
		});
	});

	router.post('/reset/:reset_hash', function reset_post(req, res) {
		var reset_hash = req.params.reset_hash;
		var password = req.body.password;
		var confirm_password = req.body.confirm_password;

		if (password !== confirm_password) {
			renderResetPage(req, res, reset_hash, "Passwords don't match!");
			return;
		}

		user_manager.update_user_password(req.session.reset_username, password, function reset_password(err, results) {
			if (err) {
				renderResetPage(req, res, reset_hash, err.message);
				return;
			}

			res.render('auth/reset_success.jade', {});

			clearOldResetHashes(req.session.reset_username);
		});
	});

	function clearOldResetHashes(username) {
		var startTime = Date.now();
		user_manager.password_reset_model.clear_old_reset_hashes(username, function delete_old_hashes(err, results) {
			if (err) {
				console.log ("Clearing reset hashes for %s threw an error: %s", username, err.message);
				return;
			}

			var duration = (Date.now() - startTime) / 1000; // duration in seconds
			console.log("Clearing reset hashes for %s took %s seconds", username, duration);
		});
	}

	function renderResetPage(req, res, reset_hash, error) {
		res.render('auth/reset.jade', {
			reset_hash: reset_hash,
			error: error
		});
	}

	/**
	 * Errors on "/auth/*" routes.
	 */
	router.use(function handleRpcError(err, req, res, next) {
		// Format error and forward to generic error handler for logging and
		// responding to the request
		err.response = err.message;
		next(err);
	});

	return router;
};
