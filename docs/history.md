# wpIdentity history

How it came to be, to whom do we owe credit, and how to explore.

### What is wpIdentity?

<a href="https://github.com/scripting/wpIdentity/tree/main">wpIdentity</a> simplifies the <a href="https://github.com/Automattic/wp-calypso/tree/trunk/packages/wpcom.js">WordPress REST API</a>, making it easier to incorporate into JavaScript apps running in the browser. 

It has grown beyond its initial function to serve as a foundation for a simple browser-based writing app I'm working on, that works primarily with WordPress.

### FeedLand needed it, quickly

It's called <a href="https://github.com/scripting/wpIdentity">wpidentity</a>, because that's initially what its purpose was, to provide an easy way for a browser-based app use WordPress as an identity system. That functionality is used in <a href="https://feedland.org/">FeedLand</a>. It was kind of an emergency project because Twitter, which we had previously used for identity was going through its own identity crisis. As a result FeedLand uses WP identity by default, in addition to email-based identity which serves as a backup against any future problems.

### Foundation for browser-based apps

It does much more than identity. The thing I'm most proud of is the simplicity of the API. WordPress already has a very nice REST API but it's possible to further factor the API by creating an object called wordPress which is defined in a file called <a href="https://github.com/scripting/wpIdentity/blob/main/client/api2.js">api2.js</a> in the <a href="https://github.com/scripting/wpIdentity/tree/main/client">client folder</a> of the wpidentity project, which is a very simple demo app. 

This API is patterned after the approach Facebook took in their browser interface, which I first used about ten years go when I was working on Fargo. I was very impressed with how much easier it was to use than the Twitter API which works more or less like the WordPress API does. They all get the job done, but the FB approach factors out a lot of the code you'd have to write if you were using the "naked" WordPress API. (It's possible others have done this previously, not claiming to have invented this, I want to be sure people get that.)

### WordLand (November 2024)

With <a href="https://this.how/wordland/">WordLand</a> it also gets a <a href="https://github.com/scripting/wpIdentity/blob/main/wpidentity.js#L423">storage</a> component, because WordLand needs to store drafts and user preferences. And may want to implement more storage functions in the future. 

Also the wpcom interface is slower, since we save the draft as the user types, it needs to be pretty fast. 

### Missing functionality

I still have some more functionality to cover, notably uploads of media objects.

### License

<a href="https://github.com/scripting/wpIdentity">wpIdentity</a> is licensed under the most liberal MIT license. So if Automattic or the foundation or whoever (I'm confused about who's who in this world) wants to adopt it, they can -- or any developer is free to use it however they like. As a personal favor, I would like to be credited personally as the initial author if you choose to use it, and please point back to my GitHub project. But you are not <i>required</i> to do all this. 

### Why now?

Anyway, I find myself wanting to explain this to a few people now, in Oct 2024, so I thought it would be best to write it up, and answer any questions people might have, to improve the docs. 

