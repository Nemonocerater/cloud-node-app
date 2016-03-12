'use strict';

var extend = require('lodash').assign;
var mysql = require('mysql');

var database = 'global-users';

module.exports = function(config) {

	function getConnection() {
		return mysql.createConnection(extend({
			database: config.databases.global_users
		}, config.mysql));
	}

	function insert_user(username, password_hash, callback) {
		var connection = getConnection();
		connection.query(
			'INSERT INTO `user` (`username`, `password_hash`) VALUES (?, ?)',
			[username, password_hash],
			callback
		);
		connection.end();
	}

	function update_user_password(username, password_hash, callback) {
		var connection = getConnection();
		connection.query(
			'UPDATE `user` SET `password_hash`=? WHERE username=?',
			[password_hash, username],
			callback
		);
		connection.end();
	}

	function get_user_by_username(username, callback) {
		var connection = getConnection();
		connection.query(
			'SELECT * FROM `user` WHERE `username`=?',
			[username],
			function select_user_by_username(err, results) {
				if (err) { callback(err); }

				if (Array.isArray(results) && results.length > 0) {
					callback(null, results[0]);
				} else {
					callback();
				}
			}
		);
		connection.end();
	}

	return {
		get_user_by_username: get_user_by_username,
		insert_user: insert_user,
		update_user_password: update_user_password,
	};

};
