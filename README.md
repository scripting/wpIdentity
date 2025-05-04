# wpIdentity

A <a href="https://www.npmjs.com/package/wpidentity">package</a> that implements <a href="https://developer.wordpress.com/docs/wpcc/">OAuth identity</a> and a simple verb set with wordpress.com for Node.js apps.

It's used in FeedLand for WordPress identity and it's the complete backend for WordLand.

### It works

You can try it out <a href="http://scripting.com/code/wpidentity/client/">here</a>.

You can log on, and see a list of your sites, when each was created and modified. 

Here's a <a href="https://imgs.scripting.com/2023/09/05/wpsitelist.png">screen shot</a>. 

### How to set up a server

1. Download the folder.

2. Throw away everything but the shell folder. In the shell folder you can throw away source.opml.

3. Move the shell folder to your server.

4. Edit the <a href="https://github.com/scripting/wpIdentity/blob/main/shell/config.json">config.json</a> file with the credentials you got from WordPress.com. 

4. npm install

5. node wpidentity.js

6. If you want to use the storage feature, you'll need to <a href="https://github.com/scripting/wpIdentity/blob/main/docs/storage.md">set up the database</a>. 

### History

In October 2024, I wrote a brief doc about the <a href="https://github.com/scripting/wpIdentity/blob/main/docs/history.md">history of wpIdentity</a>, its purpose, where it came from , how to explore. 

### Check out worknotes

I've been narrating my work in the <a href="https://github.com/scripting/wordpressIdentity/blob/main/worknotes.md">worknotes</a>. 

### Automattic docs

These docs proved useful at different points in this project.

* https://github.com/Automattic/wpcom.js/tree/master/docs -- docs for the routines we call 

* https://developer.wordpress.com/apps/

* https://developer.wordpress.com/docs/oauth2/

* https://github.com/Automattic/node-wpcom-oauth

* https://github.com/Automattic/wp-calypso

* https://github.com/Automattic/wp-calypso/tree/trunk/packages/wpcom.js

* https://github.com/Automattic/wp-calypso/tree/trunk/packages/wpcom.js/docs

* https://github.com/Automattic/wpcom-connect-examples

### Other pointers

I am using this site for testing. https://scripting4.wordpress.com/

