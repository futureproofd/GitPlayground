(function(global,$) {

    //function constructor
    var GitInit = function(username,authToken){
        return new GitInit.init(username,authToken);
    }
    
    /*
     Private vars
    */
    var $body = this.$('body');
    var $gitElem = this.$('#gitHub-links');
    var $favElem = this.$('#gitHub-favorites');
    var authStr;
    var LIMITER = 10;
    //GitHub AJAX search request url:
    var searchBaseUrl = 'https://api.github.com/search/repositories?sort=stars&order=desc&q=';
    //clear out old data before new request
    $gitElem.text("");
    $favElem.text("");
    
    var isAuthenticated = function(){
        var isAuth;
        authStr == undefined ? isAuth = false : isAuth = true;
        return isAuth;
    }
    
    //Get search results from GitHub
    var getSearchResults = function(searchStr) {
        //returns the entire response
        if(isAuthenticated()){
            return $.ajax({
                url: searchBaseUrl+searchStr,
                headers: { Authorization: "Basic " + authStr },
                dataType: "jsonp",
                success: function(response){
                    var gitList = response.data.items;
                    if(response.data.items.length > 0){
                        //Build our table header for results
                        $gitElem.append('<thead><tr>'+
                          '<th scope="col">Name</th>'+
                          '<th scope="col">Language</th>'+
                          '<th scope="col">Latest tag</th>'+
                          '<th scope="col"></th>'+
                          '</tr></thead><tbody>'
                        );
                        $favElem.append('<thead><tr>'+
                          '<th scope="col">Name</th>'+
                          '<th scope="col">Language</th>'+
                          '<th scope="col">Latest tag</th>'+
                          '<th scope="col"></th>'+
                          '</tr></thead><tbody>'
                        );
                    }else{
                        $gitElem.append('<div class="alert alert-danger" role="alert">No Matches found!');
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    alert(xhr.status);
                    alert(thrownError);
                }
            });
        }
    };
    
    //Get the latest tag
    var appendLatestTag = function(result){
        if(result){
            for(var i = 0; i < LIMITER; i++){
                let repoObj = {
                        name : result.data.items[i].full_name,
                        language : result.data.items[i].language,
                        url : result.data.items[i].html_url,
                        resultNum : i,
                        tags_url : result.data.items[i].tags_url
                    }
                $.ajax({
                    url: repoObj.tags_url,
                    dataType: "jsonp",
                    success: function(response){
                        //contains tags
                        if(response.data.length > 0){
                            repoObj.tag = response.data[0].name;
                            renderHTML(repoObj);
                        }else{
                            repoObj.tag = "No Tag";
                            renderHTML(repoObj);
                        }
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        alert(xhr.status);
                        alert(thrownError);
                    }
                });
            }
        }
    };
    
    //output each row to HTML
    var renderHTML = function(data){
        //build html results
        var htmlOutput ='';
        var i = 0;
        htmlOutput+='<tr><td><a href="'+data.url+'">'+data.name+'</a></td><td>'+data.language+'</td>';
        htmlOutput+= '<td>'+data.tag+'</td>';
        htmlOutput+='<td><a id="favLink'+data.resultNum+'" title="Add to favorites" href=#'+data.name+'>Add</a></td></tr>'; 

        //render/append final result to table
        $gitElem.append(htmlOutput);

        //attach event to add favorite
        $('#favLink'+data.resultNum).click(function(){
            this.addToFavorites();
        });
    };

    //API call to GitHub to add a repository to users favorite (starred) list
    var addToFavorites = function(){
      global.console.log('test');  
    };
        
    //do this before each query
    var clearSearchResults = function(){
      $gitElem.empty();
    };
    
    
    /*
    Prototype for publicly accessible method
    */
    GitInit.prototype = {
        //entry point for search queries
        getGitRepos : function(data){
            clearSearchResults();
            getSearchResults(data)
                .then(appendLatestTag);
        }
    };
    
    //Our function constructor
    GitInit.init = function(username, authToken){
        authStr = btoa(username + ":" + authToken);
    };
    
    //Set our prototype for access to methods
    GitInit.init.prototype = GitInit.prototype;
    
    //aliases
    global.GitInit = global.G$ = GitInit;
    
}(window,jQuery));

