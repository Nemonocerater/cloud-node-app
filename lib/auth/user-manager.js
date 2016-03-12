'use strict';

var extend = require('lodash').assign;
var mysql = require('mysql');
var crypto = require('crypto');

var database = 'global-users';

module.exports = function(user_model, password_reset_model) {

	function hashPassword(password, hash) {
		hash = hash ? hash : "sha256";

		return crypto
			.createHash(hash)
			.update(password)
			.digest('hex');
	}

	function insert_user(username, password, callback) {
		var password_hash = hashPassword(password);
		user_model.insert_user(
			username,
			password_hash,
			function(err, results) {
				if (err) { return callback(err); }
				callback(null, results);
			}
		);
	}

	function update_user_password(username, password, callback) {
		var password_hash = hashPassword(password);
		user_model.update_user_password(
			username,
			password_hash,
			function(err, results) {
				if (err) { return callback(err); }
				callback(null, results);
			}
		);
	}

	function login_user(username, password, callback) {
		user_model.get_user_by_username(
			username,
			function(err, user) {
				if (err) { return callback(err); }

				var password_hash = hashPassword(password);
				if (password_hash === user.password_hash) {
					callback(null, user.username);
					return;
				}

				callback();
			}
		);
	}

	function generate_reset_hash(username, callback) {
		var reset_hash = generateRandomHash(username);
		password_reset_model.save_password_reset(
			reset_hash,
			username,
			function insert_reset_url(err, results) {
				if (err) { callback(err); }

				if (results.affectedRows === 1) {
					callback(null, reset_hash);
				} else {
					callback();
				}
			}
		);
	}

	function generateRandomHash(secret, hash) {
		hash = hash ? hash : "sha256";
		var key = Date.now() + secret;

		return crypto
			.createHash(hash)
			.update(key)
			.digest('hex');
	}

	function get_reset_hash_username(reset_hash, callback) {
		password_reset_model.get_password_reset(
			reset_hash,
			function get_reset_hash(err, password_reset) {
				if (err) { callback(err); }

				if (password_reset) {
					callback(null, password_reset.username);
				} else {
					callback();
				}
			}
		);
	}

	return {
		login_user: login_user,
		insert_user: insert_user,
		update_user_password: update_user_password,
		generate_reset_hash: generate_reset_hash,
		get_reset_hash_username: get_reset_hash_username,

		/* Properties */
		user_model: user_model,
		password_reset_model: password_reset_model
	};

};
