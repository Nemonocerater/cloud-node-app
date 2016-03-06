'use strict';

var express = require('express');
var crypto = require('crypto');
var bodyParser = require('body-parser');

module.exports = function auth_export(user_model) {

	var router = express.Router();

	// Automatically parse request body as form data
	router.use(bodyParser.urlencoded({ extended: false }));

	// Set Content-Type for all responses for these routes
	router.use(function (req, res, next){
		res.set('Content-Type', 'text/html');
		next();
	});

	router.get('/', function auth_home(req, res, next) {
		res.render('auth/auth_home.jade', {
			username: req.session.username,
		});
	});

	/**
	 * GET /auth/login?redirect
	 *
	 * Allows user to login
	 */
	router.get('/login', function login_get(req, res, next) {
		var redirect = req.query.redirect;

		res.render('auth/login.jade', {
			redirect: redirect
		});
	});

	/**
	 * POST /auth/login?redirect
	 *
	 * Processes whether a user can log in or not.
	 */
	router.post('/login', function login_post(req, res, next) {
		var redirect = req.query.redirect;
		var username = req.body.username;
		var password = req.body.password;

		user_model.login_user(username, password, function (err, results) {
			if (err) {
				console.log (err);
				res.send(JSON.stringify(err));
			} else {
				req.session.username = results;
				res.redirect(redirect);
			}
		});
	});

	/**
	 * GET /auth/logout
	 *
	 * Logs the user out
	 */
	router.get('/logout', function logout(req, res) {
		var redirect = req.query.redirect;

		req.session = null;
		res.render('auth/logout.jade', {
			redirect: redirect
		});
	});

	router.get('/reset/:reset_hash', function reset(req, res) {
		var reset_hash = req.params.reset_hash;

		user_model.get_reset_hash_username(reset_hash, function get_reset_user(err, username) {
			var error = null;
			if (err) {
				error = err.message;
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
		} else if (password !== "password") {
			renderResetPage(req, res, reset_hash, "Invalid password");
		} else {
			res.render('auth/reset_success.jade', {
				username: req.session.reset_username
			});
		}
	});

	function renderResetPage(req, res, reset_hash, error) {
		res.render('auth/reset.jade', {
			reset_hash: reset_hash,
			username: req.session.reset_username,
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
