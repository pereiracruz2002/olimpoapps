angular.module('starter.controllers', ['ionic','firebase'])
App.controller('LoginCtrl', function($scope,$state,$ionicPopup,$firebaseAuth,UserService) {
  var auth = $firebaseAuth();
  $scope.signIn = function (user) {
    $scope.firebaseUser = null;
    $scope.error = null;

    auth.$signInWithEmailAndPassword(user.email,user.password).then(function(firebaseUser) {
        $scope.firebaseUser = firebaseUser;
        UserService.saveProfile(firebaseUser);
        $state.go('tab.dash');
      }).catch(function(error) {
        var alertPopup = $ionicPopup.alert({
              title: 'Erro no Login',
              template: error
      });
    }); 
  }

})

.controller('RegisterCtrl',function($scope,$stateParams,$state,$ionicPopup,$q,$firebaseAuth,UserService){
  $scope.myModel= {'tab': 1};

  var firebaseAuthObject = $firebaseAuth();

  var root = firebase.database().ref();

  var geocoder = new google.maps.Geocoder();
    $scope.getAddressSuggestions = function(queryString){
        var defer = $q.defer();
        geocoder.geocode(
          {
              address: queryString,
              componentRestrictions: {country: 'BR'}
          },
          function (results, status) {
              if (status == google.maps.GeocoderStatus.OK) {
                
                defer.resolve(results); 
              }
              else { defer.reject(results); }
          }
          );
        return defer.promise;
    }

  $scope.cadastro = function(user){
    var dados = user.estado;
    if(typeof dados === 'object'){
      var cidade = dados.address_components[1].short_name;
      var estado = dados.address_components[2].short_name;
    }
    var estado_cidade = cidade+"_"+estado;

    firebaseAuthObject.$createUserWithEmailAndPassword(user.email, user.password).then(function(firebaseUser) {
      firebase.auth().currentUser.sendEmailVerification().then(function() {

        if(user.tipo =='aluno')
          var usuarios = root.child('alunos/');
        else
          var usuarios = root.child('profissionais/');


          var newUsers = usuarios.push();
            newUsers.set({
            id:firebaseUser.uid,
            nome : user.nome,
            sobrenome:user.sobrenome,
            sexo:user.sexo,
            email:user.email,
            nascimento:user.nascimento,
            estado:estado,
            cidade:cidade,
            estado_cidade:estado_cidade  
          }).then(function(retorno){
            if(user.tipo =="aluno")
              $state.go('tab.dash');
            else
              $state.go("setup-profile-professional");

          }).catch(function(error) {
             var alertPopup = $ionicPopup.alert({
                  title: 'Erro no Cadastro',
                  template: error
              });
          });

      }).catch(function(error) {
         var alertPopup = $ionicPopup.alert({
              title: 'Erro ao enviar email',
              template: error
          });
      });
    }).catch(function(error) {
         var alertPopup = $ionicPopup.alert({
              title: 'Erro no Cadastro',
              template: error
          });
      });
   }


})

.controller('DashCtrl', function($scope,$firebaseObject) {
  $scope.myModel= {'tab': 1};
  var root = firebase.database().ref();
  $scope.profiles = $firebaseObject(root.child('profissionais').orderByChild('estado').equalTo('SP'));
})

.controller('DashDetailCtrl', function($scope, $stateParams,$firebaseObject) {
  var profissional = $stateParams.dashId;
  var root = firebase.database().ref();
  var map;
  var markers = [];
  $scope.$watch('myModel.tab', function () {
      console.log($scope.myModel.tab)
      if ($scope.myModel.tab == 2) {
          buildMap();
      }
  })

  function buildMap() {
      document.getElementById('map').style.height = (window.innerHeight - 145) + 'px';

      map = new google.maps.Map(document.getElementById('map'), {
          zoom: 11,
          center:{ lat:-23.7482748,lng:-46.6887343}
          //center: {lat: $rootScope.geo.coords.latitude, lng: $rootScope.geo.coords.longitude}
      });
       angular.forEach($scope.eventos, function (evento, key) {
            if (evento.latitude && evento.longitude) {
                setTimeout(function () {
                    markers[key] = new google.maps.Marker({
                        position: {lat: parseFloat(-23.7482748), lng: parseFloat(-46.6887343)},
                        map: map,
                        animation: google.maps.Animation.DROP,
                        title: evento.event_name
                    })
                    markers[key].addListener('click', function () {
                        new google.maps.InfoWindow({
                            content:
                                    '<div class="content">' +
                                    '<div class="bodyContent">' +
                                    '<a href="">' + evento.event_name + '</a>' +
                                    '</div>' +
                                    '</div>'

                        }).open(map, markers[key]);
                    })
                }, (key * 200));
            }
        })
        setTimeout(function () {
            google.maps.event.trigger(map, 'resize');
        }, 100);
    }
  $scope.profiles = $firebaseObject(root.child('profissionais').orderByChild('id').equalTo(profissional));

})

.controller('ChatsCtrl', function($scope, UserService,$firebaseObject) {
  var auth = UserService.getProfile();
  var root = firebase.database().ref();
  $scope.chats  = [];
  var chat = $firebaseObject(root.child('chat').orderByChild('aluno').equalTo(auth));
  console.log(chat)
  chat.$loaded(
    function(data) {
      var key = Object.keys(data)[0];
       console.log(data[key].profissional); // true
      $scope.chats = $firebaseObject(root.child('profissionais').orderByChild('id').equalTo(key));
    },
    function(error) {
      console.error("Error:", error);
    }
  )

})

.controller('ChatDetailCtrl', function($scope, $stateParams, UserService,$firebaseObject) {
  var profissional = $stateParams.chatId;
  var auth = UserService.getProfile();
  var profissional_aluno = profissional+'_'+auth;
  var root = firebase.database().ref();
  $scope.chats  = [];
  var chat = $firebaseObject(root.child('chat').orderByChild('profissional_aluno').equalTo(profissional_aluno));
  chat.$loaded(
    function(data) {
      var key = Object.keys(data)[0];
       console.log(key); // true
      $scope.chats = $firebaseObject(root.child('conversas').orderByChild('id').equalTo(key));
    },
    function(error) {
      console.error("Error:", error);
    }
  )


})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
