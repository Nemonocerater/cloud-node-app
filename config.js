'use strict';

var config = module.exports = {
	port: process.env.PORT || 8080,

	secret: "super-secret-code",

	// dataBackend can be 'datastore', 'cloudsql', or 'mongodb'
	dataBackend: 'cloudsql',

	// This is the id of your project in the Google Developers Console.
	gcloud: {
		projectId: process.env.GCLOUD_PROJECT || 'cloud-testing-1228'
	},

	mysql: {
		user: process.env.MYSQL_USER || 'bookuser',
		password: process.env.MYSQL_PASSWORD || 'bookuser',
		host: process.env.MYSQL_HOST || '173.194.237.202'
	},

	databases: {
		global_users: 'global_users'
	},

	mongodb: {
		url: process.env.MONGO_URL || 'mongodb://localhost:27017',
		collection: process.env.MONGO_COLLECTION || 'books'
	}
};

var projectId = config.gcloud.projectId;

if (!projectId || projectId === 'your-project-id') {
	throw new Error('You must set the GCLOUD_PROJECT env var or add your ' +
		'project id to config.js!');
}
