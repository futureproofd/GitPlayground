(function(global,$) {

    //function constructor
    var GitInit = function(username, password, authToken){
        return new GitInit.init(username, password, authToken);
    }
    
    /*
     Private vars
    */
    var $body = this.$('body');
    var $gitElem = this.$('#gitHub-links');
    var $favElem = this.$('#gitHub-favorites');
    var authStr;
    var userName;
    var password;
    var LIMITER = 10;
    //GitHub AJAX search request url:
    var apiBaseUrl = 'https://api.github.com/';
    var searchBaseUrl = 'https://api.github.com/search/repositories?sort=stars&order=desc&q=';
    var searchUserUrl = 'https://api.github.com/users/';
    //clear out old data before new request
    $gitElem.text("");
    $favElem.text("");
    
    var isAuthenticated = function(){
        var isAuth;
        authStr == undefined ? isAuth = false : isAuth = true;
        
        if(!isAuth){
            if(password && userName){
                getUserAuthToken();
            }
        }
        return isAuth;
    }
    
    //Get search results from GitHub
    var getSearchResults = function(searchStr) {
        //returns the entire response
        if(isAuthenticated()){
            return $.ajax({
                url: searchBaseUrl+searchStr+'&access_token='+authStr,
                headers: { "Authorization" : "token " + authStr,
                           Accept: "application/vnd.github.v3+json",
                         },
                dataType: "jsonp",
                success: function(response){
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
                        user : result.data.items[i].owner['login'],
                        repoName : result.data.items[i].name,
                        language : result.data.items[i].language,
                        url : result.data.items[i].html_url,
                        id : result.data.items[i].id,
                        resultNum : i,
                        tags_url : result.data.items[i].tags_url
                    }
                $.ajax({
                    url: repoObj.tags_url+'?callback=cb&access_token='+authStr,
                    dataType: "jsonp",
                    headers: { "Authorization": "token " + authStr,
                               Accept: "application/vnd.github.v3+json",
                             },
                    success: function(response){
                        //contains tags
                        if(response.data.length > 0){
                            repoObj.tag = response.data[0].name;
                            getUserFavorites(repoObj);
                        }else{
                            repoObj.tag = "No Tag";
                            getUserFavorites(repoObj);
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
    
    
    //check if provided user contains any matching favorites to our search results
    var getUserFavorites = function(repoObj){
        //returns the entire response
        if(isAuthenticated() && userName){
            $.ajax({
                url: searchUserUrl+userName+'/starred?callback=cb&access_token='+authStr,
                headers: { "Authorization" : "token " + authStr,
                           Accept: "application/vnd.github.v3+json",
                         },
                dataType: "jsonp",
                success: function(response){
                    if(response.data.length > 0){
                        for(var i = 0; i < response.data.length; i++){
                            if(response.data[i].id === repoObj.id){
                                repoObj.isFavorite = true;
                            }
                        }
                        repoObj.isFavorite ? renderHTML(repoObj,true) : renderHTML(repoObj,false);
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    alert(xhr.status);
                    alert(thrownError);
                }
            });
        }
    };
       
    
    //Get an auth token if there wasn't already one specified
    var getUserAuthToken = function(){
            $.ajax({ 
                url: 'https://api.github.com/authorizations',
                type: 'POST',
                dataType:'json',
                beforeSend: function(xhr) { 
                    var encodedLogin =  btoa(userName + ':' + password)
                    xhr.setRequestHeader("Authorization", "Basic " + encodedLogin);
                },
                data: '{"scopes":["public_repo","repo"],"note":"blame futureproofd for this"}'
            }).done(function(response) {
                authStr = response.token;
            });
    };
    
    var addToFavorites = function(repoObj){
        $.ajax({ 
            url: 'https://api.github.com/user/starred/'+repoObj.user+'/'+repoObj.repoName,
            type: 'PUT',
            beforeSend: function(xhr) { 
                xhr.setRequestHeader("Authorization", "token " + authStr); 
            }
        }).done(function(response) {
            console.log(response);
        }).error(function(err) {
            console.log(err);
        });  
    };
    
    //API call to GitHub to remove a repository to users favorite (starred) list
    var removeFromFavorites = function(repoObj){
        $.ajax({ 
                url: 'https://api.github.com/user/starred/'+repoObj.user+'/'+repoObj.repoName,
                type: 'DELETE',
                beforeSend: function(xhr) { 
                    xhr.setRequestHeader("Authorization", "token " + authStr); 
                }
            }).done(function(response) {
                console.log(response);
            }).error(function(err) {
                console.log(err);
            });    
    };
    
    /**
    * Renders HTML for each repo - used in iteration
    * @param {Object} [data] - repo object wtih parameters
    * @param {boolean} [isFavorite] - is the given repo a user favorite
    */
    var renderHTML = function(data,isFavorite){
        //build html results
        var htmlOutput ='';
        var htmlFav = '';
        var i = 0;
        
        htmlOutput+='<tr><td><a href="'+data.url+'">'+data.name+'</a></td><td>'+data.language+'</td>';
        htmlOutput+= '<td>'+data.tag+'</td>';
        
        //render/append final result to table
        if(isFavorite){
            htmlFav='<td><a id="remFavLink'+data.resultNum+'" title="Remove from favorites" href=#'+data.name+'>Remove</a></td></tr>'; 
            $favElem.append(htmlOutput+htmlFav);
            //attach event to remove favorite
            $('#remFavLink'+data.resultNum).click(function(){
                removeFromFavorites(data);
            });
        }else{
            htmlFav='<td><a id="addFavLink'+data.resultNum+'" title="Add to favorites" href=#'+data.name+'>Add</a></td></tr>'; 
            $gitElem.append(htmlOutput+htmlFav);
            //attach event to add favorite
            $('#addFavLink'+data.resultNum).click(function(){
                addToFavorites(data);
            });
        }
    };

        
    //do this before each query
    var clearSearchResults = function(){
      $gitElem.empty();
      $favElem.empty();
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
    
    
    /**
    * Function constructor. Supplies Git Authentication
    * @param {string} [username] - the user to use for user-scoped queries
    * @param {Requestable.auth} [auth] - information required to authenticate to Github
    */
    GitInit.init = function(username, password, authToken){
        authStr = authToken;
        userName = username;
        password = password;
    };
    
    //Set our prototype for access to methods
    GitInit.init.prototype = GitInit.prototype;
    
    //aliases
    global.GitInit = global.G$ = GitInit;
    
}(window,jQuery));

