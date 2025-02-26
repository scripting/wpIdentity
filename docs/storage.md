# Storage

Every wpidentity installation has the option of providing user-level storage.

#### How to

1. Provide an object named <i>database</i> in config.json. There's an example in <a href="https://github.com/scripting/wpIdentity/blob/main/config.json">config.json</a> in this repo.

2. In your MySQL database, create tables wpstorage and users with these commands. 

```SQL

create table wpstorage (	id int auto_increment key, 	username varchar (255), 	relpath varchar (255), 	flprivate boolean,	idSite int unsigned not null default 0,	idPost int unsigned not null default 0,	type varchar (64),	filecontents longtext,	whenCreated datetime, 	whenUpdated datetime, 	ctSaves int unsigned not null default 0,	index draftIndex (username, relpath, flprivate, idSite, idPost)	);create table users (	id int auto_increment primary key,	username varchar(255) not null unique,	ctHits int unsigned not null default 0,	whenLastHit datetime not null default current_timestamp,	lastBrowser varchar(512) not null default '',	whenCreated datetime not null default current_timestamp,	metadata json not null default (json_object())	);

```

3. If you put this table in its own database you should create the database with:

`create database wpidentity character set utf8mb4 collate utf8mb4_unicode_ci;`

#### How it works

We use WordPress for identity.

Each user has their own set of files. For example, you could keep a prefs.json file for each user, or a bookmarks.opml file. 

A file can be attached to a specific WP post, identified by site and post id's. This can be used for per-post prefs, or using a different kind of editor to write a post. It basically allows you to store data alongside a post. It could also be that the post is sort of a home page for a data set that's attached to the page. It's basically viewing WordPress as a database that has publishing built-in. 

Files can be public or private. At this point there's no functionality for public files.

The relpath field is meant to be a relative path to the "home" of the user's storage, but it's really just a string. You can use slashes to create structure, so for example there could be prefs files for different apps, with the first part of the path being the name of the app. The demo app stores its prefs file in demo/prefs.json. 

#### Queries that work

select id, username, relpath, type, idSite, idPost, whenCreated, whenUpdated, ctSaves from wpstorage order by whenUpdated desc;

select filecontents from wpstorage where id = 65; 

select filecontents from wpstorage where relpath = 'bingeworthy/profile.json';

select id, username, whenCreated, whenUpdated, ctSaves from wpstorage where relpath = 'wordland/prefs.json' order by ctSaves desc limit 25;

select * from log order by id desc limit 100;

select id, eventName, whenCreated from log order by id desc limit 100;

select id, eventData from log order by id desc limit 100;

