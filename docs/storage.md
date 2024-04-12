# Storage

Every wpidentity installation has the option of providing user-level storage.

#### How to

1. Provide an object named <i>database</i> in config.json. There's an example in config.json in this repo.

2. In your MySQL database, create a table called wpstorage with this command. 

```SQL

create table wpstorage (	username varchar (255), 	relpath varchar (255), 	flprivate boolean,	idSite int unsigned not null default 0,	idPost int unsigned not null default 0,	type varchar (64),	filecontents text,	whenCreated datetime, 	whenUpdated datetime, 	ctSaves int default 0,	primary key (username, relpath, flprivate, idSite, idPost)	);

```

3. If you put this table in its own database you should create the database with:

`create database wpidentity character set utf8mb4 collate utf8mb4_unicode_ci;`

#### How it works

We use WordPress for identity.

Each user has their own set of files. For example, you could keep a prefs.json file for each user, or a bookmarks.opml file. 

A file can be attached to a specific WP post, identified by site and post id's. This can be used for per-post prefs, or using a different kind of editor to write a post. It basically allows you to store data alongside a post. It could also be that the post is sort of a home page for a data set that's attached to the page. It's basically viewing WordPress as a database that has publishing built-in. 

Files can be public or private. At this point there's no functionality for public files.

The relpath field is meant to be a relative path to the "home" of the user's storage, but it's really just a string. You can use slashes to create structure, so for example there could be prefs files for different apps, with the first part of the path being the name of the app. The demo app stores its prefs file in demo/prefs.json. 

