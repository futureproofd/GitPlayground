# GitPlayground
Initialize app using GitInit(username?:string,authToken?:string,password?:(optional));

Examples:
//Authenticated user (good):
var gitSearcher = GitInit('futureproofd','2841e5sssc28613a4a123cbefdb1e0a32affff8a');

//Unauthenticated (bad):
var gitSearcher = G$('futureproofd','','mypassword');

//Get Git repos with search parameter:
gitSearcher.getGitRepos(searchParam);
