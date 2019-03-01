
/*-------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------*/
DROP TABLE IF EXISTS t_user CASCADE;

CREATE TABLE t_user (
	id 			BIGSERIAL,
	email			VARCHAR(128) NOT NULL,
	name			VARCHAR(128) NOT NULL,
	CONSTRAINT pk_user
       PRIMARY KEY (user_id),
	CONSTRAINT uk_user_email
		UNIQUE (email)
);

/*-------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------*/
DROP TABLE IF EXISTS t_user_auth CASCADE;

CREATE TABLE t_user_auth (
	id	 		BIGSERIAL,
	user_id	 	BIGINT NOT NULL,
	hash			VARCHAR(128) NOT NULL,
	salt			VARCHAR(255) NOT NULL,
	CONSTRAINT pk_user_auth
       PRIMARY KEY (id),
	CONSTRAINT fk_user_auth_user
       FOREIGN KEY (user_id)
	REFERENCES t_user(id),
	CONSTRAINT uk_user_auth_user
		UNIQUE (user_id)
);

/*-------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------*/
DROP TABLE IF EXISTS t_requisition_log CASCADE;

CREATE TABLE t_requisition_log (
	id				BIGSERIAL,
	begin_date			TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	end_date			TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	user_id			BIGINT NOT NULL,
    	endpoint			VARCHAR(128) NOT NULL,
    	params				VARCHAR(255),
    	req_body			VARCHAR,
	resp_code			VARCHAR(128),
    	resp_body			VARCHAR,
    	CONSTRAINT pk_requisition_log
       PRIMARY KEY (id),
	CONSTRAINT fk_requisition_user
       FOREIGN KEY (user_id)
	REFERENCES t_user(id)
);

/*-------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------*/
DROP TABLE IF EXISTS t_threshold_period CASCADE;

CREATE TABLE t_threshold_period (
	id	 		BIGSERIAL,
	user_id	 	BIGINT NOT NULL,
	start_date		DATE NOT NULL,
	length			INTEGER NOT NULL,
	CONSTRAINT pk_threshold_period
       PRIMARY KEY (id),
	CONSTRAINT fk_threshold_period_user
       FOREIGN KEY (user_id)
	REFERENCES t_user(id),
	CONSTRAINT uk_threshold_period_user
		UNIQUE (user_id)
);

/*-------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------*/
DROP TABLE IF EXISTS t_account CASCADE;

CREATE TABLE t_account (
	id	 		BIGSERIAL,
	user_id	 	BIGINT NOT NULL,
	name			VARCHAR(32) NOT NULL,
	description		VARCHAR(128),
	CONSTRAINT pk_account
       PRIMARY KEY (id),
	CONSTRAINT fk_account_user
       FOREIGN KEY (user_id)
	REFERENCES t_user(id),
	CONSTRAINT uk_account_name
		UNIQUE (name)
);

/*-------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------*/
DROP TABLE IF EXISTS t_saving_goal CASCADE;

CREATE TABLE t_saving_goal (
	id	 		BIGSERIAL,
	account_id	 	BIGINT NOT NULL,
	name			VARCHAR(128) NOT NULL,
	income_percentagee	NUMBER NOT NULL,
	maximum_income	NUMBER,
	start_date		DATE,
	end_date		DATE,
	CONSTRAINT pk_saving_goal
       PRIMARY KEY (id),
	CONSTRAINT fk_saving_goal_account
       FOREIGN KEY (account_id)
	REFERENCES t_account(id),
	CONSTRAINT uk_account_name
		UNIQUE (name)
);

/*-------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------*/
DROP TABLE IF EXISTS t_transaction_category CASCADE;

CREATE TABLE t_transaction_category (
	id	 		BIGSERIAL,
	user_id	 	BIGINT NOT NULL,
	name			VARCHAR(128) NOT NULL,
	period_goal		NUMBER,
	CONSTRAINT pk_transaction_category
       PRIMARY KEY (id),
	CONSTRAINT fk_transaction_category_user
       FOREIGN KEY (user_id)
	REFERENCES t_user(id),
	CONSTRAINT uk_transaction_category_name
		UNIQUE (name)
);

/*-------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------*/
DROP TABLE IF EXISTS t_transaction CASCADE;

CREATE TABLE t_transaction (
	id	 		BIGSERIAL,
	account_id	 	BIGINT NOT NULL,
	category_id	 	BIGINT,
	status		 	CHAR NOT NULL DEFAULT 'P',
	date			DATE NOT NULL,
	time			TIME WITHOUT TIME ZONE NOT NULL,
	time_zone		INTEGER NOT NULL,
	value			NUMBER NOT NULL,
	insert_date		TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	last_edit_date	TIMESTAMP WITHOUT TIME ZONE,
	CONSTRAINT pk_transaction
       PRIMARY KEY (id),
	CONSTRAINT fk_transaction_account
       FOREIGN KEY (account_id)
	REFERENCES t_account(id),
	CONSTRAINT fk_transaction_category
       FOREIGN KEY (category_id)
	REFERENCES t_transaction_category(id)
);

/*-------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------*/
DROP TABLE IF EXISTS t_recurrent_transaction CASCADE;

CREATE TABLE t_recurrent_transaction (
	id	 		BIGSERIAL,
	account_id	 	BIGINT NOT NULL,
	payments		INTEGER,
	CONSTRAINT pk_recurrent_transaction
       PRIMARY KEY (id),
	CONSTRAINT fk_recurrent_transaction_account
       FOREIGN KEY (account_id)
	REFERENCES t_account(id)
);

/*-------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------*/
DROP TABLE IF EXISTS t_recurrent_transaction_detail CASCADE;

CREATE TABLE t_recurrent_transaction_detail (
	id	 			BIGSERIAL,
	recurrent_transaction_id	BIGINT NOT NULL,
	transaction_id		BIGINT NOT NULL,
	CONSTRAINT pk_recurrent_transaction
       PRIMARY KEY (id),
	CONSTRAINT fk_recurrent_transaction_parent
       FOREIGN KEY (recurrent_transaction_id)
	REFERENCES t_recurrent_transaction(id),
	CONSTRAINT fk_recurrent_transaction_child
       FOREIGN KEY (transaction_id)
	REFERENCES t_transaction(id)
);