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

