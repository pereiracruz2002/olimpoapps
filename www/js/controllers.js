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

.controller('RegisterCtrl',function($scope,$stateParams,$state,$ionicPopup,$q,$firebaseAuth,$firebaseArray,$cordovaCamera,$ionicPlatform,UserService){
  $scope.myModel= {'tab': 1};
  $scope.formData = {'picture': ''};

  var firebaseAuthObject = $firebaseAuth();

  var root = firebase.database().ref();

  var userReference = root.child("images/" + 1);
  var syncArray = $firebaseArray(userReference.child("imageuploadapp"));
  $scope.images = syncArray;


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


        $ionicPlatform.ready(function(){
        if(typeof(Camera) != 'undefined'){
            var options = {
                quality: 50,
                destinationType: Camera.DestinationType.DATA_URL,
                sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM,
                allowEdit: true,
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: 300,
                targetHeight: 300,
                popoverOptions: CameraPopoverOptions,
                saveToPhotoAlbum: false,
                correctOrientation:true
            };
        }

        $scope.choosePicture = function(){
            $cordovaCamera.getPicture(options).then(function(imageData) {
                $scope.formData.picture = "data:image/jpeg;base64," + imageData;
                syncArray.$add({image: imageData}).then(function() {
                console.log("Image has been uploaded");
            });
                
            }, function(err) {
              console.log(err)
            });
        }

    });


        function procesarImagen(pathImagen) {
          var directorioFuente = pathImagen.substring(0, pathImagen.lastIndexOf('/') + 1),
          archivoFuente = pathImagen.substring(pathImagen.lastIndexOf('/') + 1, pathImagen.length),
          nombreParaGuardar = new Date().valueOf() + archivoFuente;

          $cordovaFile.readAsArrayBuffer(directorioFuente, archivoFuente)
              .then(function (success) {
                  var blob = new Blob([success], {type: 'image/jpeg'});
                  enviarFirebase(blob, nombreParaGuardar);
              }, function (error) {
                  console.error(error);
          });

        function enviarFirebase(file, nombre) {
    var storageRef = firebase.storage().ref();
    var uploadTask = storageRef.child('images/' + nombre).put(file);
    uploadTask.on('state_changed', function (snapshot) {
        console.info(snapshot);
    }, function (error) {
        console.error(error);
    }, function () {
        var downloadURL = uploadTask.snapshot.downloadURL;
        console.log(downloadURL);
    });
}


}


       
   // })

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

        firebaseUser.updateProfile({
          displayName: user.nome,
          photoURL: "https://i0.wp.com/www.revistabula.com/wp/wp-content/uploads/2017/01/elvis.jpg?resize=610%2C350"
        }).then(function() {
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
                  title: 'Erro ao Inserir no banco',
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
  var map;
  var markers = [];
  $scope.myModel= {'tab': 1};
  var root = firebase.database().ref();
  $scope.$watch('myModel.tab', function () {
      if ($scope.myModel.tab == 2) {
          buildMap();
      }
  })
  $scope.profiles = $firebaseObject(root.child('profissionais').orderByChild('estado').equalTo('SP'));
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
  
})

.controller('DashDetailCtrl', function($scope, $stateParams,$firebaseObject,$firebaseArray) {
  var profissional = $stateParams.dashId;
  var root = firebase.database().ref();
  $scope.profiles = [];
  $scope.profiles = $firebaseArray(root.child('profissionais').orderByChild('id').equalTo(profissional));
  console.log($scope.profiles)

})

.controller('ChatsCtrl', function($scope, UserService,$firebaseObject) {
  var auth = JSON.parse(UserService.getProfile());
  var root = firebase.database().ref();
  $scope.chats  = [];
  $scope.chats = $firebaseObject(root.child('chat').orderByChild('aluno').equalTo(auth.uid));

})

.controller('ChatDetailCtrl', function($scope, $stateParams, UserService,$firebaseObject) {
  var profissional = $stateParams.chatId;
  var auth = JSON.parse(UserService.getProfile());
  var profissional_aluno = profissional+'_'+auth.uid;
  var root = firebase.database().ref();
  var objMessage = {};
  $scope.chats  = [];


  var chat = $firebaseObject(root.child('chat').orderByChild('profissional_aluno').equalTo(profissional_aluno));
  chat.$loaded(
    function(data) {
      var key = Object.keys(data)[0];
      $scope.chats = $firebaseObject(root.child('conversas').orderByChild('id').equalTo(key));

    },
    function(error) {
      console.error("Error:", error);
    }

  );

  function dataAtual(){
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();
    if(dd<10){
        dd='0'+dd;
    } 
    if(mm<10){
        mm='0'+mm;
    } 
    return  today = dd+'/'+mm+'/'+yyyy;
  }

  $scope.sendMessage = function(){
    var conversaRef = root.child('conversas/');
    var data = dataAtual();
    var message = conversaRef.push();
    var id = $scope.chats[Object.keys($scope.chats)[0]].id
    var message = conversaRef.push();
    objMessage = {
      id:profissional,
      nome:auth.displayName,
      photoURL:auth.photoURL,
      texto: $scope.data.message
    }
    message.set(objMessage).then(function(retorno){
      $scope.chats.push(objMessage)
    });
  }


})


.controller('AccountDetailCtrl', function($scope, $stateParams,$firebaseObject,$firebaseArray) {
  var id = $stateParams.accountId;
  var root = firebase.database().ref();
  $scope.myTab= {'tab': 1};
  $scope.user = {};
  $scope.Optionsexo = [{ name: 'Masculino', id: 1 }, { name: 'Feminino', id: 2 }];
 
 
  $dados = $firebaseArray(root.child('alunos').orderByChild('id').equalTo(id));
  $dados.$loaded(
    function(data) {
      var key = Object.keys(data)[0];
      $scope.user.photoURL = data[0].photoURL;
      $scope.user.nome = data[0].nome;
      $scope.user.sobrenome = data[0].sobrenome;
      $scope.user.email = data[0].email;
      $scope.user.password = data[0].password;
      var str_birthday = data[0].nascimento.split('-');
      var bairro_cidade = data[0].estado_cidade.split('_');
      $scope.user.nascimento = new Date(str_birthday[0] + '/'+ str_birthday[1] + '/'+str_birthday[2]);
      $scope.user.estado = bairro_cidade[1]+','+bairro_cidade[0];
      $scope.user.sexo = data[0].sexo;

    },
    function(error) {
      console.error("Error:", error);
    }
  );

   $scope.editar = function(user){
    var dados = user.estado;
    if(typeof dados === 'object'){
      var cidade = dados.address_components[1].short_name;
      var estado = dados.address_components[2].short_name;
    }
    var estado_cidade = cidade+"_"+estado;

        if(user.tipo =='aluno')
          var usuarios = root.child('alunos/'+id);
        else
          var usuarios = root.child('profissionais/'+id);


          editUsers{
            nome : user.nome,
            sobrenome:user.sobrenome,
            sexo:user.sexo,
            email:user.email,
            nascimento:user.nascimento,
            estado:estado,
            cidade:cidade,
            estado_cidade:estado_cidade  
          };

        editUsers.$save().then(function(ref) {
          ref.key === obj.$id; // true
        }, function(error) {
          console.log("Error:", error);
        });

  }







})

.controller('AccountCtrl', function($scope,$firebaseAuth,$firebaseArray,UserService) {
  // $scope.settings = {
  //   enableFriends: true
  // };
  var auth = JSON.parse(UserService.getProfile());
  //var usuarios = root.child('alunos/');
  var root = firebase.database().ref();
  $scope.profiles = $firebaseArray(root.child('alunos').orderByChild('id').equalTo(auth.uid));
  console.log($scope.profiles)
});
