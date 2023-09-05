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

