#### 8/5/25; 10:37:13 AM by DW

New endpoint -- getrangeofdraftsforuser, calls new function -- getRangeOfDraftsForUser.

#### 7/5/25; 10:11:12 AM by DW

Add metadata to post, basically send through a few bits of info we have in the WordLand's draft object. 

The values we add to the metadata for the post:

* wordland_apiVersion: the version number of the metadata we include, starting with 0.4.0 today.

* wordland_linksTo: the value of the item-level &lt;link> element in WordLand's RSS feed for the site, if there is one, the empty string if not. It's used in linkblog posts. 

* wordland_idDraft: a unique id for this post in WordLand's database. It is only unique to this instance of the server. 

* wordland_markdowntext: WordLand stores the post in Markdown format. We like to include it along with the rendered text whenever we can, encouraging broader use of Markdown. 

* wordland_title: the title of the post, the empty string if the post doesn't have a title.

There are limits to where this works, I will try to find out exactly where they are. ;-)

A <a href="https://github.com/scripting/wpIdentity/issues/6">place</a> for questions and comments.

#### 5/11/25; 11:00:38 AM by DW

A new endpoint to update a category: updateSiteCategory.

#### 5/4/25; 8:58:10 AM by DW

in api2.js

* When we startup do an initial websocket checkConnection after 1/10th second. 

* Then we check every 10 seconds.

* I didn't like the lag at startup, having to wait 10 secs before we start the connection.

* All the complexity is for when it doesn't work. What about when it does?

#### 5/1/25; 4:43:06 PM by DW

Rewrote wsConnectUserToServer in api2.js. It was retrying a failed connection once a second and never terminates. Now it tries once every ten seconds and gives up after 100 tries. I think this is still pretty generous and the number of tries could be reduced without giving up anything. 

#### 4/28/25; 9:02:20 AM by DW

Rewrote the websocket code to use the <a href="https://www.npmjs.com/package/ws">ws package</a> instead of the "nodejs-websocket". As promised by all my chatbot ai friends, it fixed a big problem, and promises to work better with everything. Esp important for networking software. ;-)

Fixed a problem in convertSite where the server would crash if it was converting a site that was not running on wordpress.com. The problem is that such sites don't contain an options object. 

#### 4/27/25; 4:57:44 PM by DW

In webSocketStartup we watch for errors and report them.

#### 4/24/25; 5:45:59 PM by DW

getSiteCategories now paginates, so if you have 300+ categories, we can handle it. 

#### 3/26/25; 9:49:16 AM by DW

In uploadImage, check for idSite == "undefined" -- return an error, don't try to upload. 

But it's even worse than it appears. In api2.js, there is new code for my codebase for doing a POST using jQuery. And it hadn't been tested with errors returned from a POST operation. The bug in the new code was that it always reported "error" even though the server had returned a more meaningful message. It took me a while to look at the client. 

#### 3/24/25; 5:53:10 PM by DW

We were adding posts and updating posts via HTTP GET and we have to use POST. Hit the limit today on a post I was updating. Made the switch. 

#### 3/17/25; 12:31:15 PM by DW

Add urlAvatar, urlProfile to the user info record we return via the api.

#### 3/15/25; by DW

New category endpoints -- wordpressaddcategory, wordpressdeletecategory.

#### 3/14/25; 10:27:39 AM by DW

config.homePagetable lets you add macros to the home page for the site being served through the home page. 

#### 3/12/25; 10:07:45 AM by DW

getUsername, as exported on the 10th, doesn't work -- and I never figured out why. instead i created a clone of callWithUsername that can be called by an app that includes wpIdentity, just as it can call it in its http-handling function. remarkably, it does work. i can now move on.  

#### 3/10/25; 3:28:48 PM by DW

Exporting getUsername function, it's needed in writersweb. It could have worked with getUserInfo, which is already exported, but we have a cache on getUsername, and rather than replicate the functionality at a higher level, it's best to export it.

#### 3/9/25; 1:00:40 PM by DW

Update in api2.js. this.getUserInfo assumed that the server had already been called to ask for it, and cached it in wordpressMemory, and that's true in WordLand, but not true in a new app I'm working on. So we have to account for that possibility, and be ready to call the server if it isn't initialized. Fairly sure there's no chance of breakage, because we're just replacing undefined with actual data. 

#### 3/7/25; 4:18:02 PM by DW

I want to be able to bake wpidentity into an app, starting with writersweb. 

1. I will need to call it's httpRequest handler, which is exported, so that's cool.

2. I will need to be able to get information about a user, providing a token and getting back a struct. 

Both these functions are already exported. Hmm. 

#### 2/26/25; 9:49:12 AM by DW

Adding a users table. I want to be able to gather metadata, right now I want to know what browsers people are using, so I know how important it is to get it working in each browser. Apparently there are problems in some versions of Safari, but I only have gotten one report. I need to see what's actually going on, and to have a way to gather other data. 

See countUserHit function.

The users table is documented on the <a href="https://github.com/scripting/wpIdentity/blob/main/docs/storage.md">docs/storage.md page</a>.

#### 2/24/25; 9:26:16 AM by DW

I want separate events for addPost and updatePost operations. 

* Previously we were using "publish" for both events. So instead of calling both "publish" we'll just use the names of the functions that implement them.

* Also want the title of the post to be included with both events. 

#### 2/23/25; 12:38:27 PM by DW

We now log publish operations. 

#### 2/22/25; 9:08:07 AM by DW

In readUserFile, we need to send a clear message back to the caller if the file they're looking for simply doesn't exist. That is not actually an error here, it happens with bookmarks.opml the first time a user signs on to WordLand. The change is in readUserFile.

#### 1/24/25; 8:36:53 AM by DW

If a user has a deleted WordPress website, convertSite will crash, trying to create a data structure for it. 

Changes in getUserSites and convertSite. 

#### 12/23/24; 5:22:22 PM by DW

New call -- wordpressgettopusers, returns an array of the top users ranked by number of times their WordLand prefs.json file has been read, which happens when you first load the app. It doesn't measure activity, ie editing and publishing. 

#### 12/23/24; 12:07:10 PM by DW

The demo app was broken in several ways. It now works properly.

* Setting serverAddress and urlChatLogSocket correctly at startup, don't depend on defaults in api2.js.

* logOffWordpress was missing.

* viewing the site list was broken because we weren't waiting for the site list to load in myWordpress.startup. Fixed it by reading the site list from the server when displaying the site list. I understand why I didn't want it to wait at startup, it's not something WordLand needs to display until the user asks to see the site list.

* startTestPrefs call was commented out, uncommented, set number of tests to 5 instead of 60. 

* There was a problem in saving prefs, something we had fixed in WordLand but the update had not made it into the demo app. 

Hopefully from this point forward there will be no more breakage. We've got a good debugged app, WordLand, and it has to remain unbroken from here-out, so that bodes well, we hope, ymmv, ianal, mmlm. :-)

#### 12/21/24; 11:47:17 AM by DW

Add a log table using my new <a href="https://github.com/scripting/sqlLog">sqlLog</a> package.

Added config.flLogInstalled, default false. If false we won't call the log package, it should be false if you haven't created a log table in your sql database.

Now let's add some logging code

* on startup, log config.urlServer

* on websocket connect, log username

Initially I had logging in writeWholeFile but decided this was too much (for now). 

May also want to add one for every http request, makes more sense, would require a slight rewrite so we could log the username making the request. 

#### 11/18/24; 11:34:35 AM by DW

Turned off config.flConvertImagesToGutenberg.

From the GitHub thread, there's a little bit left to do, but they're going to try to account for images in plain HTML, so let's see how that goes. 

Basically we have to get the image id to agree with WordPress's idea of what its ID is. 

Really have to find and read the docs to be sure I understand how it should work.

#### 11/18/24; 10:23:32 AM by DW

Read authorizedAccounts every minute from the file.

New config value -- config.authorizedAccountsPath.

Read the file it points to once a minute, if it exists, we replace config.authorizedAccounts with the JSON structure in the file.

Makes it so you don't have to reboot to add an authorized user, just edit the contents of the file.

If there's an error parsing the file, we display the error on the console, so if you make a mistake you see it in the log right away.

Look in readAuthorizedAccounts.

#### 11/13/24; 8:32:46 AM by DW

It took three full days to get uploading images to work. A lot of trial and error and guesswork, but the code works now, and today I'm going to clean it up and move on to other things, hopefully.

Note that because we also provide an API that runs in the browser, no one will have to go through this to get functional code, the problem is solved at least for this context. 

#### 11/10/24; 12:29:58 PM by DW

Uploading images.

#### 11/1/24; 10:35:37 AM by DW

Added support for the nextPrevArray used to implement the arrows in WordLand. See getNextPrevArray.

Released v0.5.5.

#### 10/31/24; 7:03:56 PM by DW

Increase the default config.maxCtDrafts to 1000. Previously it was 100. I'm hitting that limit when I rebuild the Bookmarks menu or backup my drafts. I don't know if we can have a limit, unless we have a limit of drafts for non-paying users. That comes later. 

Also changed the default value for options.maxCtUserDraftFiles in api2.j to 1000 to agree. This is passed as a parameter to the server. 

#### 10/26/24; 9:15:57 AM by DW

Fixed a startup problem for new users. In getRecentUserDrafts we were getting the most recent drafts for all users, but we must restrict it to the user. 

#### 10/24/24; 9:19:50 AM by DW

whitelist -- so we can start testing with a limited group of users.

* two new config values: config.flUseWhitelist, a boolean default false, authorizedAccounts, an array of usernames who are authorized, default empty array.

* first version, we just add a new api call that allows you to find out if the user is whitelisted. it returns true if the whitelist is not enabled, otherwise search the authorizedAccounts list.

* core function isUserWhitelisted, also in the api2.js.

#### 10/21/24; 10:04:54 AM by DW

More categories work.

* We weren't transmitting the categories back to wordpress when creating or updating a wordpress post. 

* When asked for a list of categories for a site, do not include "uncategorized." It's not something the user can choose, nor should they be concerned about it. Not sure what they intended us to do here, but we have to work around it in every instance, so we might as well cut it out at the beginning. 

#### 10/20/24; 10:38:13 AM by DW

adding support for categories.

convertCategory converts a category from WP format to our API's format.

#### 10/17/24; 12:30:49 PM by DW

Fixed a bug in readDraft, it would crash if the draft didn't exist. 

#### 10/12/24; 10:06:11 AM by DW

Going to start posting worknotes here again.

How to debug this locally. This is what I always forget how to do so I'm documenting it somewhere I think I'll look for the info. If only I could tell ChatGPT to remember this for me. Someday soon of course. ;-) 

1. Create localStorage.wordpressMemory in the JS debugger on the client machine you're using for testing.

2. One value must be set -- accessToken -- which you should copy from a client system you're using to access the app.

* localStorage.wordpressMemory = {"accessToken": "asdfasdfasdfsf"}

3. You should start with a working config.json from the server, and modify it to correspond to the local equivalents. 

Changing type of <i>filecontents</i> column from text to longtext. 

* alter table wpstorage modify column filecontents longtext;

* one of the RSS feeds we generate got too big for a text, ie 64K.

#### 5/25/24; 10:36:42 AM by DW

Added websockets support and goodnight kisses. 

#### 5/17/24; 4:55:01 PM by DW

Added a whenPublished property to the struct returned by addPost and updatePost. 

#### 5/13/24; 9:38:56 AM by DW

Changed the name of the project from wordpressIdentity to wpIdentity, so it agrees with the name of the NPM package. 

Fixed a bug in the glossary code, we were failing if there is no glossary.json file for the user. But it's okay to not have a glossary.

#### 5/12/24; 9:02:36 AM by DW

new entrypoint -- writeUniqueFile, explained in a comment at the head of the function in source.opml

writeWholeFile is the general-purpose routine, this is for files that can only have one instance per path/type/etc

examples include the user's prefs.json file for a specific app, or the user's glossary.json file. 

these files are a lot simpler to work with than the draft.json files.

we could manage these files ourselves at a higher level, but that would mean we would have to remember the id of the glossary.json file, in order to save it.

it's simpler to just provide a new entrypoint for these files that finds the id before writing it, the info is after all, in the database. ;-)

this could be done on the client, but that means two round trips for the data. this is a little more efficient. 

#### 5/10/24; 8:53:59 AM by DW

Adding an "id" column to the database, and changing the queries accordingly.

I believe things will work much better with this approach, basically one row in the database can transition from being a draft to being published without moving. It'll keep the same id. That means you will be able to have more than one unpublished draft. I expect there will be other flexibilities. 

The id is the key.

#### 5/9/24; 11:01:19 AM by DW

I finally got to the bottom of the problem with http post returning. I'm going to fix it, and probably should eventually visit all the code that uses davehttp, because I have replicated the problem far and wide.

First, the code I use to call the server uses jQuery in such a way that errors are not reported. If we were seeing the errors we would have been able to find this much more quickly. I'm fixed it in api2.js here. 

Second, the server returns the wrong type in returnData in wpidentity.js. It was returning "application/javascript" and should have been returning "text/json".

#### 4/30/24; 10:43:14 AM by DW

Add param to getRecentUserDrafts to let the caller restrict returns to a specific site. Useful for building feeds. 

If config.flServePublicUserFiles is true, we will serve files from user storage database.

#### 4/29/24; 12:12:53 PM by DW

Update: Changed the way this works, the RSS is generated in the app, and we keep it here in user storage. Eventually public files will be availble via HTTP.

* Start work on RSS feed for each user.

* My feed would be at https://word.social/feed?username=scripting

* I checked that FeedLand doesn't have a call for /feed. If it did, we would consume it before it saw it. 

#### 4/27/24; 10:02:23 AM by DW

New call --  /wordpressgetrecentuserdrafts.

#### 4/26/24; 10:06:14 AM by DW

The problem with POST was that it works, but we're not getting any returned data. For the application we have right now that's not a deal-stopper. But it will have to be fixed. 

See note in WORD worknotes for today for explanation with glossary.

#### 4/18/24; 5:29:13 PM by DW

Markdown processing as we save to WordPress. 

Look in processPostText.

#### 4/15/24; 12:05:13 PM by DW

Process emoji shortcodes. 

#### 4/13/24; 1:41:39 PM by DW

By handling "/" in our handleHttpRequest function, we broke FeedLand.

I completely forgot that FeedLand includes this package, and that all HTTP requests go through it first, before anyone else gets it.

In that context it was meant to only handle authorization events, it certainly wasn't meant to handle requests for the home page.

Imagine my surprise when I went to feedland.social and was greeted by the home page text of an app that is not released. Oy.

So what's the fix? 

The first thing to do is a new release with the code that handles "/" commented out. 

Now the fix the other way --

take the default values of urlServer and urlServerHomePageSource out of config, in wpidentity.js, below

if you want us to handle "/" for the app, set urlServerHomePageSource in your config.json file for your app

Renamed these

deletefile ==> wordpressdeletefile

readwholefile ==> wordpressreadwholefile

writewholefile ==> wordpresswritewholefile

#### 4/12/24; 12:12:29 PM by DW

#### Put the API into a wrapper, so it's easy to spot the WordPress calls in client code. 

Left the original not-wrapped api file in place, it's used in FeedLand and possibly other places.

The new api is in api2.js. Yes, I hate that too, but I don't see another way to do it. ;-)

#### Got wpidentity.scripting.com running again. 

#### Wrote code for storage

The demo app maintains a file for each user called demo/prefs.json.

Just three values in it, a count, a date, and a slogan. Updated every minute. 

#### 3/28/24; 11:36:57 AM by DW

#### re writeUserDataFile below..

I couldn't get anything back from the server via POST, so I'm trying GET. 

It worked. I've been over it on both ends, can't see any difference between it and daveappserver which is what we use in feedland and drummer. 

So I'm just going to continue with calling GET, and trust that the next person to pass this way will figure out what I did wrong. ;-)

#### 3/25/24; 10:08:19 AM by DW

Add a cache for usernames.

#### 3/24/24; 10:55:17 AM by DW

Moved these notes to docs/storage.md.

#### 3/23/24; 7:30:58 PM by DW

Export getUserInfo, which takes an accessToken and calls back with user info.

#### 10/31/23; 10:25:25 AM by DW

Allow the caller to handle wordpress login.

#### 9/14/23; 8:28:29 AM by DW

I wanted to set categories for posts via addPost and updatePost, but found the categories have to already exist before using them, it's not as low-tech as I imagined. So for now we'll have to punt on setting categories through these calls.

#### 9/13/23; 12:56:32 PM by DW

We now summarize the various types: site, post, user, mediaobject, etc to a simpler package as we have done with other apps.

Now we have a proper foundation to build on for scripting in Drummer. 

#### 9/11/23; 12:05:47 PM by DW

When calling back to the app, instead of calling the parameter accesstoken, call it wordpressaccesstoken, to distinguish it from other apps, such as github. 

#### 9/10/23; 1:02:07 PM by DW

Getting ready to include this in daveappserver. 

The HTTP requests should all have "wordpress" in their names. 

Should be able to get by with changes only in this project, because the api.js code is here. 

#### 9/5/23; 10:26:37 AM by DW

Turned into a package so I can include it in other apps, probably FeedLand and Drummer.

Rewrite the readme.md file for this repo to put the whole thing to bed and get ready for the next thing.

#### 9/5/23; 9:25:58 AM by DW

New functions to delete a post and get the user's subscriptions. 

#### 9/4/23; 5:33:32 PM by DW

If you pass a <i>urlapphomepage</i> parameter to the /connect call, we'll redirect back to that url instead of the default.

This means that one wpidentity server can support lots of apps. 

#### 9/3/23; 10:16:21 AM by DW

I took a detour to build a "blog browser" based on the client app here, which was not intended to be anything so robust, it's just meant to be example code.

So I split it off into its own project, and refocused the client app here to its much more humble beginnings. 

#### 8/29/23; 12:14:59 PM by DW

More verbs

testGetSiteInfo (9969399)

testGetSiteMedialist (9969399)

testAddPost (9969399) -- this is the biggie of course, and it <a href="https://unberkeley.wordpress.com/2023/08/29/so-youd-like-a-test-post-2/">worked</a> the first time. ;-)

testUpdatePost (9969399, 4594) -- and this works too, changes the content without touching the title and other properties.

#### 8/28/23; 7:45:13 PM by DW

Let's add some verbs.

The docs we need are here.

https://github.com/Automattic/wp-calypso/tree/trunk/packages/wpcom.js

This is how you get the info about a post. Type this into the client console..

testGetPost (9969399, 4588)

The verbs I just implemented --

getSitePosts (token, params.idsite, httpReturn);

getSiteUsers (token, params.idsite, httpReturn);

getPost (token, params.idsite, params.idpost, httpReturn);

#### 8/28/23; 10:59:21 AM by DW

No server changes. On the client, we now <a href="https://imgs.scripting.com/2023/08/28/sitelist.png">display a list</a> of your sites with creation and modification dates after you sign on. 

#### 8/27/23; 10:17:33 AM by DW

Now I <i>really really</i> have it working. :smile: 

After getting getUserInfo to work, I thought let's quickly test getting a list of user sites, but that didn't work because i didn't get a powerful enough token. That led me back to the authentication docs, and i don't see anything there about scopes. So now I'm back to zero, I have to find docs. I consulted ChatGPT of course. 

And then I found these docs, which were *exactly* what I needed. 

https://developer.wordpress.com/docs/oauth2/

https://github.com/Automattic/wp-calypso/tree/trunk/packages/wpcom.js/docs

If you're trying to figure out how the wordpress.com api works, this is the place to start. 

Added a new config value -- config.scopes, defaults to "global". With that I was able to define the /getusersites endpoint. And it works. This is a big part of what I was trying to get to.

Run the <a href="http://scripting.com/code/wpidentity/client/">example client</a> and if you're already signed in, sign out and in again to get the more powerful token and in the JavaScript console enter: 

<code>testGetUserSites ()</code>

You get a lot of data for that request. In the next iteration I hope to provide a way to browse it. 

#### 8/26/23; 12:14:10 PM by DW

Now I <i>really</i> have it working. :smile: 

What I didn't know about the last version is that the accessToken was getting mangled by URL-encoding it. 

I hadn't actually used the accessToken until today and when I did, I got an error from wordpress.com saying that it wasn't a valid token. 

After some thought and working it out with ChatGPT (my virtual programming partner, <a href="https://chat.openai.com/share/7ecef75d-7fb4-475c-940e-7834258da3e5">transcript included</a>) I send the token back and forth by base64-ing, and url-safing it, and only doing it via HTTPS. And it works. I got a nice structure of information about me back from the server. 

Next session I'm going to try getting a list of my blogs, and then a list of posts, etc. The model here is the davetwitter package I build all my apps on. Not going to go nearly as far, at least not at first, but enough so that I can do a nice little editor for WordPress writing. 

To test, go to the <a href="http://scripting.com/code/wpidentity/client/">client test page</a>. Sign in, then open the JavaScript console and type: 

<code>testGetUserInfo ()</code>

If it worked you should see some info about yourself. If it didn't please report an <a href="https://github.com/scripting/wordpressIdentity/issues">issue</a>. 

#### 8/22/23; 10:21:35 AM by DW

Started.

A8C docs are here -- 

https://developer.wordpress.com/docs/wpcc/

A8C examples --

https://github.com/Automattic/wpcom-connect-examples

WPCOM docs --

https://github.com/Automattic/wp-calypso/tree/trunk/packages/wpcom.js

Repo is here --

https://github.com/scripting/wordpressIdentity

