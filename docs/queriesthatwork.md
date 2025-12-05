select id, username, relpath, type, idSite, idPost, whenCreated, whenUpdated, ctSaves from wpstorage order by whenUpdated desc;

select filecontents from wpstorage where id = 65; 

select filecontents from wpstorage where relpath = 'bingeworthy/profile.json';

select id, username, whenCreated, whenUpdated, ctSaves from wpstorage where relpath = 'wordland/prefs.json' order by ctSaves desc limit 25;

select * from log order by id desc limit 100;

select id, eventName, whenCreated from log order by id desc limit 100;

select id, eventData from log order by id desc limit 100;

select id, whenCreated, whenUpdated from wpstorage where username = 'scripting' and relpath = 'wordland/prefs.json' and flprivate = 1;

select * from wpstorage where username = 'scripting' and relpath = 'wordland/prefs.json' and flprivate = 1\G

select filecontents from wpstorage where username = 'scripting' and relpath = 'wordland/prefs.json' and flprivate = 1\G

select id, whenCreated from wpstorage where username = 'scripting' and relpath = 'wordland/prefs.json' and flprivate = 1;

select filecontents from wpstorage where id = 5681;

