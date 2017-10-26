angular.module('starter.services', [])

App.service('UserService', function() {
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
    
});
