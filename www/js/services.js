angular.module('starter.services', [])

App.service('UserService', function($http, URL_API, $httpParamSerializerJQLike) {
    this.getProfile= function(){
      var user = localStorage.getItem("user.current_user");
        return user;
    }
    this.saveProfile= function(user){
      localStorage.setItem("user.current_user", JSON.stringify(user));
    }
    this.logout = function(){
    	localStorage.removeItem('token');
        
    }

    this.register = function(dados) 
    {
        return $http({
            method: 'POST',
            url: URL_API+'registerUser',
            data: $httpParamSerializerJQLike(dados),
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        });
    }
    
});
