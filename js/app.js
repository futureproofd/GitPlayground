//Get our git object
var gitSearcher = GitInit('futureproofd','<your optional password>','<your user token>');

//On submit, get git search results
$('#submit-btn').click(function(){
    var searchTerm = $('#searchForm').val();
    if(searchTerm){
        gitSearcher.getGitRepos(searchTerm);
    }else{
        $('#gitHub-links').append('<div class="alert alert-primary" role="alert">Enter a repo name.');
    }
});



