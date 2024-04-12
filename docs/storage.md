# Storage

Every wpidentity installation has the option of providing user-level storage with the same setup we have in feedland.js.

How to:

1. Provide an object named <i>database</i> in config.json. There's an example in config.json in this repo.

2. In your MySQL database, create a table called wpstorage with this command. 

```SQL

create table wpstorage (	username varchar (255), 	relpath varchar (255), 	flprivate boolean,	idSite int unsigned not null default 0,	idPost int unsigned not null default 0,	type varchar (64),	filecontents text,	whenCreated datetime, 	whenUpdated datetime, 	ctSaves int default 0,	primary key (username, relpath, flprivate, idSite, idPost)	);

```

3. If you put this table in its own database you should create the database with:

`create database wpidentity character set utf8mb4 collate utf8mb4_unicode_ci;`

