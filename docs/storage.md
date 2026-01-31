# Storage

Every wpidentity installation has the option of providing user-level storage.

#### How to

1. Provide an object named <i>database</i> in config.json. There's an example in <a href="https://github.com/scripting/wpIdentity/blob/main/config.json">config.json</a> in this repo.

2. In your MySQL database, create tables wpstorage and users with these commands. 

```SQL

create table wpstorage (	id int auto_increment key, 	username varchar (255), 	relpath varchar (255), 	flprivate boolean,	idSite int unsigned not null default 0,	idPost int unsigned not null default 0,	type varchar (64),	filecontents longtext,	whenCreated datetime, 	whenUpdated datetime, 	ctSaves int unsigned not null default 0,	index draftIndex (username, relpath, flprivate, idSite, idPost)	);create table users (	id int auto_increment primary key,	username varchar(255) not null unique,	ctHits int unsigned not null default 0,	whenLastHit datetime not null default current_timestamp,	lastBrowser varchar(512) not null default '',	whenCreated datetime not null default current_timestamp,	metadata json not null default (json_object())	);create table edges (	id int auto_increment primary key,	idSourceSite int not null,	idSourcePost int not null,	idDestSite int not null,	idDestPost int not null,	sourceAuthor varchar (255)  not null default '',	destAuthor  varchar (255)  not null default '',	whenCreated datetime not null default current_timestamp, 	approved boolean default false,	key edgesToPost (idDestSite, idDestPost)	}

```

3. If you put these tables in its own database you should create the database with:

`create database wpidentity character set utf8mb4 collate utf8mb4_unicode_ci;`

#### How it works

We use WordPress for identity.

Each user has their own set of files. For example, you could keep a prefs.json file for each user, or a bookmarks.opml file. 

A file can be attached to a specific WordPress post, identified by site and post id's. This can be used for per-post prefs, or using a different kind of editor to write a post. It basically allows you to store data alongside a post. It could also be that the post is sort of a home page for a data set that's attached to the page. It's basically viewing WordPress as a database that has publishing built-in. 

Files can be public or private. Most files are private. An example of a public file is the RSS feed we keep for each site that is updated via wpIdentity. This allows us to experiment with new feed features without having to change WordPress. 

* An <a href="https://wordland.social/scripting/41915670/rss.xml">example</a> from a test site. 

The relpath field is meant to be a relative path to the "home" of the user's storage, but it's really just a string. You can use slashes to create structure, so for example there could be prefs files for different apps, with the first part of the path being the name of the app. The demo app stores its prefs file in demo/prefs.json. 

#### Queries that work

Are now on <a href="queriesthatwork.md">their own page</a>. 

