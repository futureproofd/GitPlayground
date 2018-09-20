(function(global,$) {

    /**
    * Function Constructor
    * @param {string} [username] - Required for password authentication
    * @param {string} [authToken] - Required for user authentication token access
    * @param {string} [password] - Required for password authentication
    */
    var GitInit = function(username, authToken, password = ''){
        return new GitInit.init(username, authToken, password);
    }
    
    /*
     Private vars
    */
    var $body = this.$('body');
    var $gitElem = this.$('#gitHub-links');
    var $favElem = this.$('#gitHub-favorites');
    var $searchBox = this.$('#searchForm');
    var authStr;
    var userName;
    var password;
    var LIMITER = 10;
    //GitHub API request urls:
    var searchBaseUrl = 'https://api.github.com/search/repositories?sort=stars&order=desc&q=';
    var searchUserUrl = 'https://api.github.com/users/';
    //clear out old data before new request
    $gitElem.text("");
    $favElem.text("");
    
    /**
    * Quick check on user initialization params - Ideally user already has an access token!
    */
    var isAuthenticated = function(){
        var isAuth;
        isAuth = typeof authStr == undefined ? isAuth = false : isAuth = true;
        isAuth = typeof authStr === 'string' ? isAuth = true : isAuth = false;
        
        if(!isAuth && !authStr){
            if(password && userName){
                getUserAuthToken();
                isAuth = true;
            }
        }
        return isAuth;
    }
    
    /**
    * Initial API query containing search results
    * @param {string} [searchStr] - user provided search term
    */
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
        }else{
            alert('Please enter a username and password while initializing the git program to receive a temporary authorization token.');
        }
    };
    
    /**
    * Another iterative async query to get latest tag per rep
    * @param {Object} [result] - the initial repo from ajax response
    */
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
    
    /**
    * Check if provided user contains any matching favorites to our search results
    * @param {Object} [repoObj] - object containing useful repo properties
    */
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
       
    /**
    * API call to GitHub to get an authorization token to perform starred operations
    */
    var getUserAuthToken = function(){
        var accessTokenNote = "blame futureproofd for this "+Math.random().toString
            $.ajax({ 
                url: 'https://api.github.com/authorizations',
                type: 'POST',
                dataType:'json',
                beforeSend: function(xhr) { 
                    var encodedLogin =  btoa(userName + ':' + password)
                    xhr.setRequestHeader("Authorization", "Basic " + encodedLogin);
                    
                },
                data: '{"scopes":["public_repo","repo"],"note":"'+accessTokenNote+'"}'
            }).done(function(response) {
                authStr = response.token;
            });
    };
    
    /**
    * API call to GitHub to add a repository to users favorite (starred) list
    * @param {Object} [repoObj] - object containing useful repo properties
    */
    var addToFavorites = function(repoObj){
        $.ajax({ 
            url: 'https://api.github.com/user/starred/'+repoObj.user+'/'+repoObj.repoName,
            type: 'PUT',
            beforeSend: function(xhr) { 
                xhr.setRequestHeader("Authorization", "token " + authStr); 
            }
        }).done(function(response) {
            console.log(response);
            renderHTML(repoObj,true);
        }).error(function(err) {
            console.log(err);
        });  
    };
    
    /**
    * API call to GitHub to remove a repository to users favorite (starred) list
    * @param {Object} [repoObj] - object containing useful repo properties
    */
    var removeFromFavorites = function(repoObj){
        $.ajax({ 
                url: 'https://api.github.com/user/starred/'+repoObj.user+'/'+repoObj.repoName,
                type: 'DELETE',
                beforeSend: function(xhr) { 
                    xhr.setRequestHeader("Authorization", "token " + authStr); 
                }
            }).done(function(response) {
                //remove html link
                $('#remFavLink'+repoObj.resultNum).closest('tr').remove();
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
        
        //begin table row
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
    
    /**
    * Prototype for publicly accessible method
    * @param {string} [data] - search term
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
    GitInit.init = function(username, authToken, passwd){
        authStr = authToken;
        userName = username;
        password = passwd;
    };
    
    //Set our prototype for access to methods
    GitInit.init.prototype = GitInit.prototype;
    
    //aliases
    global.GitInit = global.G$ = GitInit;
    
}(window,jQuery));

