CREATE TABLE password_reset (
	reset_hash VARCHAR(64) NOT NULL PRIMARY KEY,
	username VARCHAR(80) NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (username) REFERENCES user (username)
);
