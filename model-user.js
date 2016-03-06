'use strict';

var extend = require('lodash').assign;
var mysql = require('mysql');
var crypto = require('crypto');

var database = 'global-users';

module.exports = function(config) {

	function getConnection() {
		return mysql.createConnection(extend({
			database: config.databases.global_users
		}, config.mysql));
	}

	function hashPassword(password, hash) {
		hash = hash ? hash : "sha256";

		return crypto
			.createHash(hash)
			.update(password)
			.digest('hex');
	}

	function insert_user(username, password, callback) {
		var password_hash = hashPassword(password);
		var connection = getConnection();
		connection.query(
			'INSERT INTO `user` (`username`, `password_hash`) VALUES (?, ?)',
			[username, password_hash],
			function(err, results) {
				if (err) { return callback(err); }
				callback(null, results);
			}
		);
		connection.end();
	}

	function login_user(username, password, callback) {
		var connection = getConnection();
		connection.query(
			'SELECT * FROM `user` WHERE `username`=?',
			[username],
			function(err, results) {
				if (err) { return callback(err); }

				var logged_in_user = null;
				if (Array.isArray(results) && results.length > 0) {
					var user = results[0];
					var password_hash = hashPassword(password);
					if (password_hash === user.password_hash) {
						logged_in_user = user.username;
					}
				}

				callback(null, logged_in_user);
			}
		);
		connection.end();
	}

	function generate_reset_hash(username, callback) {
		var reset_hash = generateRandomHash(username);
		var connection = getConnection();
		connection.query(
			'INSERT INTO `password_reset` (`reset_hash`, `username`) VALUES (?, ?)',
			[reset_hash, username],
			function insert_reset_url(err, results) {
				if (err) { callback(err); }
				console.log (results);
				callback(null, results);
			}
		);
		connection.end();
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
		var connection = getConnection();
		connection.query(
			'SELECT * FROM `password_reset` WHERE `reset_hash`=?',
			[reset_hash],
			function select_reset_hash(err, results) {
				if (err) { callback(err); }
				console.log(results);
				callback(null, results.username);
			}
		);
		connection.end();
	}

	return {
		login_user: login_user,
		insert_user: insert_user,
		generate_reset_hash: generate_reset_hash,
		get_reset_hash_username: get_reset_hash_username
	};

};
