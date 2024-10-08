# wpIdentity history

How it came to be, to whom do we owe credit, and how to explore.

### What it is

<a href="https://github.com/scripting/wpIdentity/">wpIdentity</a> is a package I developed over the last couple of years, for a browser-based writing app I'm working on that works with WordPress. 

wpIdentity simplifies the <a href="https://github.com/Automattic/wp-calypso/tree/trunk/packages/wpcom.js">WordPress REST API</a>, making it easier to incorporate into JavaScript apps running in the browser. 

### FeedLand needed it, quickly

It's called <a href="https://github.com/scripting/wpIdentity">wpidentity</a>, because that's initially what its purpose was, to provide an easy way for such an app to hook into WordPress as an identity system. That functionality is used in <a href="https://feedland.org/">FeedLand</a>. It was kind of an emergency project because Twitter, which we had previously used for identity was going through its own identity crisis. As a result FeedLand uses WP identity by default, in addition to email-based identity.

### Foundation for browser-based apps

It does much more than identity. The thing I'm most proud of is the simplicity of the API. WordPress already has a very nice REST API but it's possible to further factor the API by creating an object called wordPress which is defined in a file called <a href="https://github.com/scripting/wpIdentity/blob/main/client/api2.js">api2.js</a> in the <a href="https://github.com/scripting/wpIdentity/tree/main/client">client folder</a> of the wpidentity project, which is a very simple demo app. The this API is patterned after the approach Facebook took in their browser interface, which I first used about ten years go when I was working on Fargo. I was very impressed with how much easier it was to use than the Twitter API which works more or less like the WordPress API does. They all get the job done, but the FB approach factors out a lot of the code you'd have to write if you were using the "naked" WordPress API. (It's possible others have done this previously, not claiming to have invented this, I want to be sure people get that.)

### Missing functionality

I still have some more functionality to cover, notably uploads of images and media objects. It's a high priority for the app I've developed that runs on top of this API. 

### Why now?

Anyway, I find myself wanting to explain this to a few people now, so I thought it would be best to write it up in a blog post, and li

<a href="https://github.com/scripting/wpIdentity">wpIdentity</a> is licensed under the most liberal MIT license. So if Automattic or the foundation or whatever (I'm very confused about who's who in this world) wants to adopt it, or any developer is free to use it however they like. As a personal favor, I would like to be credited personally as the initial author if you choose to use it, and please point back to my GitHub project. But you are not <i>required</i> to do all this.  

If you have any questions, please post an issue in the repo here. 

