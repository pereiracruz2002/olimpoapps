angular.module('starter.controllers', ['ionic', 'firebase']);
App.controller('LoginCtrl', function ($scope, $state, $ionicPopup, $firebaseAuth, UserService) {
  var auth = $firebaseAuth();
  $scope.signIn = function (user) {
    $scope.firebaseUser = null;
    $scope.error = null;

    auth.$signInWithEmailAndPassword(user.email, user.password).then(function (firebaseUser) {
      $scope.firebaseUser = firebaseUser;

      var profile = firebaseUser.displayName;
      var arraytipo = profile.split('_');
      var tipo = arraytipo[1];

      $scope.addressShow = false

      if (tipo == "profissionais") {
        $scope.addressShow = true;
      }

      firebaseUser.tipo = tipo;
      UserService.saveProfile(firebaseUser);

      $scope.tipo = tipo;

      if (tipo == "aluno") {
        $state.go('tab.dash');
      } else {
        $state.go('tab.account');
      }

    }).catch(function (error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      var msgError = "";
      console.log("url ");
      if (errorCode === 'auth/invalid-email') {
        msgError = 'Digite um email válido.';
      } else if (errorCode === "auth/argument-error") {
        msgError = 'Email deve ser uma string valida.';
      } else if (errorCode === 'auth/wrong-password') {
        msgError = 'Senha Incorreta.';
      } else if (errorCode === 'auth/user-not-found') {
        msgError = 'Usuário não encontrado.';
      } else if (errorCode === 'auth/argument-error') {
        msgError = 'Senha deve ser uma string.';
      } else if (errorCode === 'auth/user-not-found') {
        msgError = 'Nenhum usuário encontrado.';
      } else if (errorCode === 'auth/too-many-requests') {
        msgError = 'Muitas tentativas de login, por favor tente mais tarde.';
      } else if (errorCode === 'auth/network-request-failed') {
        msgError = 'Tempo expirado, por favor tente novamente.';
      } else {
        msgError = 'Usuário não encontrado.';
        //msgError =errorMessage
      }
      var alertPopup = $ionicPopup.alert({
        title: 'Erro no Login',
        template: msgError
      });
    });
  }

  // This is the success callback from the login method
  var fbLoginSuccess = function (response) {
    if (!response.authResponse) {
      fbLoginError("Cannot find the authResponse");
      return;
    }

    var authResponse = response.authResponse;

    getFacebookProfileInfo(authResponse)
      .then(function (profileInfo) {
        // For the purpose of this example I will store user data on local storage
        UserService.setUser({
          authResponse: authResponse,
          userID: profileInfo.id,
          name: profileInfo.name,
          email: profileInfo.email,
          picture: "http://graph.facebook.com/" + authResponse.userID + "/picture?type=large"
        });
        //    $ionicLoading.hide();
        $state.go('tab.dash');
      }, function (fail) {
        // Fail get profile info
        console.log('profile info fail', fail);
      });
  };

  // This is the fail callback from the login method
  var fbLoginError = function (error) {
    console.log('fbLoginError', error);
    //  $ionicLoading.hide();
  };

  // This method is to get the user profile info from the facebook api
  var getFacebookProfileInfo = function (authResponse) {
    var info = $q.defer();

    facebookConnectPlugin.api('/me?fields=email,name&access_token=' + authResponse.accessToken, null,
      function (response) {
        console.log(response);
        info.resolve(response);
      },
      function (response) {
        console.log(response);
        info.reject(response);
      }
    );
    return info.promise;
  };

  //This method is executed when the user press the "Login with facebook" button
  $scope.facebookSignIn = function () {
    facebookConnectPlugin.getLoginStatus(function (success) {
      if (success.status === 'connected') {
        // The user is logged in and has authenticated your app, and response.authResponse supplies
        // the user's ID, a valid access token, a signed request, and the time the access token
        // and signed request each expire
        console.log('getLoginStatus', success.status);

        // Check if we have our user saved
        var user = UserService.getUser('facebook');

        if (!user.userID) {
          getFacebookProfileInfo(success.authResponse)
            .then(function (profileInfo) {
              // For the purpose of this example I will store user data on local storage
              UserService.setUser({
                authResponse: success.authResponse,
                userID: profileInfo.id,
                name: profileInfo.name,
                email: profileInfo.email,
                picture: "http://graph.facebook.com/" + success.authResponse.userID + "/picture?type=large"
              });

              $state.go('tab.dash');
            }, function (fail) {
              // Fail get profile info
              console.log('profile info fail', fail);
            });
        } else {
          $state.go('tab.dash');
        }
      } else {
        // If (success.status === 'not_authorized') the user is logged in to Facebook,
        // but has not authenticated your app
        // Else the person is not logged into Facebook,
        // so we're not sure if they are logged into this app or not.

        console.log('getLoginStatus', success.status);

        //		$ionicLoading.show({
        //      template: 'Logging in...'
        //    });

        // Ask the permissions you need. You can learn more about
        // FB permissions here: https://developers.facebook.com/docs/facebook-login/permissions/v2.4
        facebookConnectPlugin.login(['email', 'public_profile'], fbLoginSuccess, fbLoginError);
      }
    });
  };

  $scope.resetPassword = function (user) {
    var emailAddress = user.email;
    var alertPopup = $ionicPopup.alert({
      title: 'E-mail de refinição de senha enviado',
      template: 'Um link para redefinição de sua senha foi enviado no seu e-mail cadastrado.'
    });
    auth.$sendPasswordResetEmail(emailAddress).then(function () {
      // Email sent.
    }).catch(function (error) {
      // An error happened.
    });
  }

})

  .controller('RegisterCtrl', function ($scope, $stateParams, $state, $ionicPopup, $q, $firebaseAuth, $firebaseArray, $cordovaCamera, $ionicPlatform, UserService, $ionicModal) {
    $scope.myModel = { 'tab': 1 };
    $scope.user = { 'picture': '' };

    var firebaseAuthObject = $firebaseAuth();

    var root = firebase.database().ref();

    var geocoder = new google.maps.Geocoder();
    $scope.getAddressSuggestions = function (queryString) {
      var defer = $q.defer();
      geocoder.geocode(
        {
          address: queryString,
          componentRestrictions: { country: 'BR' }
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


    $ionicPlatform.ready(function () {
      if (typeof (Camera) != 'undefined') {
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
          correctOrientation: true
        };
      }

      $scope.choosePicture = function () {
        $cordovaCamera.getPicture(options).then(function (imageData) {
          $scope.user.picture = "data:image/jpeg;base64," + imageData;
          //syncArray.$add({image: imageData}).then(function() {
          //console.log("Image has been uploaded");
          //});

        }, function (err) {
          console.log(err)
        });
      }
    });



    $scope.cadastro = function (user) {
      $scope.formData = {};
      var dados = user.estado;
      var auth = $firebaseAuth();
      if (typeof dados === 'object') {
        var cidade = dados.address_components[0].short_name;
        var estado = dados.address_components[1].short_name;
        var estado_cidade = cidade + "_" + estado;
      }


      var data = new Date(new Date(user.nascimento));
      var year = data.getFullYear();
      var month = data.getMonth() + 1 //getMonth is zero based;
      var day = data.getDate();
      var months = { "1": "01", "2": "02", "3": "03", "4": "04", "5": "05", "6": "06", "7": "07", "8": "08", "9": "09", "10": "10", "11": "11", "12": "12" };
      var formatted = day + "-" + months[month] + "-" + year;


      firebaseAuthObject.$createUserWithEmailAndPassword(user.email, user.password).then(function (firebaseUser) {
        firebase.auth().currentUser.sendEmailVerification().then(function () {
          firebaseUser.updateProfile({
            displayName: user.nome,
            photoURL: user.picture
          }).then(function () {
            $scope.formData = {
              id: firebaseUser.uid,
              nome: user.nome,
              sobrenome: user.sobrenome,
              sexo: user.sexo,
              email: user.email,
              nascimento: formatted,
              estado: estado,
              cidade: cidade,
              tipo_id: user.tipo
            }


            if (user.tipo == 'aluno')
              var usuarios = root.child('alunos/');
            else
              var usuarios = root.child('profissionais/');



            firebaseUser.updateProfile({
              displayName: user.nome + '_' + user.tipo,
              photoURL: user.picture
            }).then(function () {
              var newUsers = usuarios.push();
              newUsers.set({
                id: firebaseUser.uid,
                nome: user.nome,
                sobrenome: user.sobrenome,
                imagem: user.picture,
                sexo: user.sexo,
                email: user.email,
                nascimento: formatted,
                estado: estado,
                cidade: cidade,
                estado_cidade: estado_cidade
              }).then(function (retorno) {

                UserService.saveProfile(firebaseUser);

                if (user.tipo == "aluno")
                  $state.go('tab.dash');
                else
                  $state.go('tab.account');


              }).catch(function (error) {
                var alertPopup = $ionicPopup.alert({
                  title: 'Erro no Cadastro',
                  template: error
                });
              });

            }).catch(function (error) {
              var alertPopup = $ionicPopup.alert({
                title: 'Erro ao Inserir no banco',
                template: error
              });
            });

          }).catch(function (error) {
            var alertPopup = $ionicPopup.alert({
              title: 'Erro ao enviar email',
              template: error
            });
          });
        }).catch(function (error) {
          var alertPopup = $ionicPopup.alert({
            title: 'Erro no Cadastro',
            template: error
          });
        });
      });
    }


    $ionicModal.fromTemplateUrl('templates/termo.html', {
      scope: $scope,
      animation: 'slide-in',
    }).then(function (m) {
      $scope.modal = m;

    });

    $scope.abreModal = function () {

      $scope.modal.show();

    }

    $scope.fechaModal = function () {
      $scope.modal.hide();
    }

    /*  $ionicPopup.show({
        scope: $scope,
        template: 'templates/termo.html',
        title: 'Termos de Uso',
      }).then(function (p) {
        $scope.alertPopup = p;
   
      });
  
    $scope.abrePopup = function () {
      scope: $scope;
      var alertPopup = $ionicPopup.alert({
        title: 'Termos de Uso',
        template: 'O Olimpo não é fornecedor de quaisquer bens, bem como não presta qualquer tipo de serviço de atividade ou condicionamento'
      });
  
      $scope.alertPopup.show();
  
    }*/

  })

  // .controller('DashCtrl', function($scope,$firebaseObject,$firebaseArray,$ionicLoading,$rootScope,$q) {
  //   var map;
  //   lat = '';
  //   lng = '';
  //   var markers = [];
  //   $scope.myModel= {'tab': 1};
  //   $scope.formData = {
  //     city: "",

  //   };
  //   $scope.formDataSearch = {
  //     num_start: 0,
  //     num_end:0,
  //     modalidades:'',
  //     sexo:''

  //   }
  //   $scope.profiles = [];

  //   $scope.especialidades = {};


  //   $scope.treinos = '';
  //   var root = firebase.database().ref();
  //   $scope.$watch('myModel.tab', function () {
  //       if ($scope.myModel.tab == 2) {
  //           buildMap();
  //       }
  //   })

  //   var geocoder = new google.maps.Geocoder();
  //     $scope.getAddressSuggestions = function(queryString){
  //         var defer = $q.defer();
  //         geocoder.geocode(
  //           {
  //               address: queryString,
  //               componentRestrictions: {country: 'BR'}
  //           },
  //           function (results, status) {
  //               if (status == google.maps.GeocoderStatus.OK) {

  //                 defer.resolve(results); 
  //               }
  //               else { defer.reject(results); }
  //           }
  //           );
  //         return defer.promise;
  //     }

  //   $scope.especialidades = $firebaseObject(root.child('treinos').orderByChild('modalidade'));



  //   $scope.search = function (formDataSearch) {
  //     var treinamentos = '';
  //     var dados = [];
  //     var firebaseNo = 'profissionais_treinos/Treino';

  //   console.log(formDataSearch.sexo)
  //   if(formDataSearch.modalidades != ''){
  //     firebaseNo = 'profissionais_treinos/Treino';
  //     busca = formDataSearch.modalidades;
  //   }else if(formDataSearch.sexo != ''){
  //     firebaseNo = 'profissionais_sexo/Sexo';
  //     busca = formDataSearch.sexo;
  //   }else if(formDataSearch.num_start != 0){
  //     firebaseNo = 'profissionais_valor/Valor';
  //     busca = formDataSearch.num_start;
  //   }else if(formDataSearch.modalidades != '' && formDataSearch.sexo != ''){
  //     firebaseNo = 'treino_sexo/'+formDataSearch.modalidades;
  //     busca = formDataSearch.sexo; 
  //   }
  //   //console.log(busca)
  //     info_treinos = $firebaseArray(root.child(firebaseNo).child(busca));
  //     console.log(info_treinos)
  //     info_treinos.$loaded().then(function(data){
  //       angular.forEach(info_treinos, function (valor, chave) {
  //         dados= $firebaseArray(root.child('profissionais').orderByChild('id').startAt(valor.$id));
  //         dados.$loaded().then(function(info){
  //           $scope.profiles.push({nome:info[0].nome,sobrenome:info[0].sobrenome,id:info[0].id,photoURL:info[0].photoURL});
  //           var key = Object.keys(info)[0];
  //           angular.forEach(info[key].treinos, function (modalidade, key) {
  //             if(modalidade.name !="undefined"){
  //               treinamentos+=modalidade.name+",";
  //               $scope.treinos = treinamentos.slice(0, -1);
  //             }
  //           });
  //         })
  //       });  
  //     });
  //     $scope.myModel= {'tab': 1};
  //   }

  //   $scope.$watch('formData.city', function () {
  //          var treinamentos = '';

  //          var dados = $scope.formData.city;
  //          if (typeof dados === 'object') {
  //           //console.log(dados)
  //             $scope.formData.cidade = dados.address_components[0].short_name;
  //             $scope.formData.estado = dados.address_components[1].short_name;
  //             // loc[0]=dados.address_components[0].geometry.location.lat();
  //             // loc[1]=dados.address_components[0].geometry.location.lng();
  //             lat = dados.geometry.location.lat();
  //             lng = dados.geometry.location.lng();
  //             $scope.titulo = 'Profissionais em ' + $scope.formData.cidade + ' - ' + $scope.formData.estado;

  //             info = $firebaseArray(root.child('profissionais').orderByChild('cidade').equalTo($scope.formData.cidade));
  //               $scope.profiles = info;
  //               info.$loaded(
  //               function(info) {
  //                 var key = Object.keys(info)[0];
  //                 angular.forEach(info[key].treinos, function (modalidade, key) {
  //                   if(modalidade.name !="undefined"){
  //                     treinamentos+=modalidade.name+",";
  //                     $scope.treinos = treinamentos.slice(0, -1);
  //                   }
  //                 });

  //               },
  //               function(error) {
  //                 console.error("Error:", error);
  //               }
  //             );
  //         }
  //    });



  //   function buildMap() {
  //     var i = 0;
  //     document.getElementById('map').style.height = (window.innerHeight - 145) + 'px';

  //       map = new google.maps.Map(document.getElementById('map'), {
  //           zoom: 11,
  //           center:{ lat:lat,lng:lng}
  //           //center: {lat: $rootScope.geo.coords.latitude, lng: $rootScope.geo.coords.longitude}
  //       });

  //        angular.forEach($scope.profiles, function (profissional, chave) {
  //             //if (evento.latitude && evento.longitude) {
  //                 setTimeout(function () {
  //                     markers[chave] = new google.maps.Marker({
  //                         position: {lat: parseFloat(lat), lng: parseFloat(lng)},
  //                         map: map,
  //                         animation: google.maps.Animation.DROP,
  //                         title: profissional.name
  //                     })
  //                     markers[chave].addListener('click', function () {
  //                         new google.maps.InfoWindow({
  //                             content:
  //                                     '<div class="content">' +
  //                                     '<div class="bodyContent">' +
  //                                     '<a href="#/tab/dash">'+$scope.profiles.length+'</a>' +
  //                                     '</div>' +
  //                                     '</div>'

  //                         }).open(map, markers[chave]);
  //                     })
  //                 }, (chave * 200));
  //             //}
  //         })
  //         setTimeout(function () {
  //             google.maps.event.trigger(map, 'resize');
  //         }, 100);
  //   }

  // })

  .controller('DashCtrl', function ($scope, $firebaseArray, $timeout, $ionicModal, $ionicPopup, UserService) {
    var root = firebase.database().ref();
    $scope.location = {};
    $scope.list = [];
    $scope.data = {
      distance: 10
    };

    $scope.modalidades = [
      'Artes Marciais',
      'Atividades aquáticas',
      'Obesos, Cardiopatas e diabéticos',
      'Ciclismo',
      'Condicionamento Físico',
      'Corrida de rua e Caminhada',
      'Cross Fit',
      'Emagrecimento',
      'Gestantes',
      'Hiit',
      'Hipertrofia',
      'Natação',
      'Personal Figth',
      'Pilates',
      'Reabilitação',
      'Treinamento Funcional',
      'Tênis',
      'Yoga',
      'Zumba Fitness'
    ];

    var auth = JSON.parse(UserService.getProfile());

    var profile = auth.displayName;
    var arraytipo = profile.split('_');
    var tipo = arraytipo[1];
    $scope.tipo = { 'tipo': 1 };
    console.log(tipo)

    var myPopupEspecialidades = $ionicPopup.show({
      templateUrl: 'templates/popup-especialidades.html',
      title: 'Especialidades',
      scope: $scope,
      buttons: [
        { text: 'Cancel' }, {
          text: '<b>Save</b>',
          type: 'button-positive',
          onTap: function (e) {
            if (!$scope.data) {
              e.preventDefault();
            } else {
              console.log($scope.data.modalidades)
              return $scope.data.modalidades;
            }
          }
        }
      ]
    });

    myPopupEspecialidades.then(function (resposta) {
      $scope.list = [];

      $scope.FilterByEspecialides(resposta);
      //$scope.geoQuery();
    });

    $scope.FilterByEspecialides = function (resposta) {

      $scope.list = $firebaseArray(root.child('enderecos').orderByChild('modalidade').equalTo(resposta));

      // UserService.getEspecialidades(resposta).then(function (restaurant) {
      //   console.log(restaurant)


      // var modalidades = restaurant.modalidade;

      // for (i = 0; i < modalidades.length; i++) { 
      //     console.log(modalidades[i]);
      //     if(modalidades[i]==$scope.data.modalidade){
      //       $scope.list.push(restaurant);
      //     $scope.list = uniqueArray($scope.list, '$id');
      //     }
      // }
      //$scope.list.push(restaurant);
      //$scope.list = uniqueArray($scope.list, '$id');
      // });

    }


    $scope.locationChangedCallback = function (location) {
      $scope.list = [];
      $scope.lat = location.geometry.location.lat();
      $scope.lng = location.geometry.location.lng();
      $scope.geoQuery();
    };

    $scope.geoQuery = function () {

      var geoQuery = UserService.getByGeo($scope.lat, $scope.lng, $scope.data.distance);
      console.log(geoQuery)
      geoQuery.on("key_entered", function (key, location, distance) {
        console.log(key)
        $timeout(function () {

          UserService.get(key).then(function (restaurant) {
            //console.log(restaurant)
            restaurant.distance = distance.toFixed(2);

            // var modalidades = restaurant.modalidade;

            // for (i = 0; i < modalidades.length; i++) { 
            //     console.log(modalidades[i]);
            //     if(modalidades[i]==$scope.data.modalidade){
            //       $scope.list.push(restaurant);
            //     $scope.list = uniqueArray($scope.list, '$id');
            //     }
            // }
            $scope.list.push(restaurant);
            $scope.list = uniqueArray($scope.list, '$id');
          });
        }, 300);
      });

      geoQuery.on("key_exited", function (key, location, distance) {
        console.log(key, location, distance);
      });

      geoQuery.on("ready", function () {
        $scope.ready = true;
      });

      function uniqueArray(collection, keyname) {
        var output = [], keys = [];
        angular.forEach(collection, function (item) {
          var key = item[keyname];
          if (keys.indexOf(key) == -1) {
            keys.push(key);
            output.push(item);
          }
        });
        return output;
      };
    };

    $scope.filter = function () {

      // Custom popup
      var myPopup = $ionicPopup.show({
        templateUrl: 'templates/popup-filter.html',
        title: 'Distance in Km',
        scope: $scope,
        buttons: [
          { text: 'Cancel' }, {
            text: '<b>Save</b>',
            type: 'button-positive',
            onTap: function (e) {
              if (!$scope.data) {
                e.preventDefault();
              } else {
                return $scope.data;
              }
            }
          }
        ]
      });

      myPopup.then(function (res) {
        $scope.list = [];
        $scope.geoQuery();
      });
    };

    $scope.filterModalities = function () {

      // Custom popup
      var myPopup = $ionicPopup.show({
        templateUrl: 'templates/popup-especialidades.html',
        title: 'Especialidades',
        scope: $scope,
        buttons: [
          { text: 'Cancel' }, {
            text: '<b>Save</b>',
            type: 'button-positive',
            onTap: function (e) {
              if (!$scope.data) {
                e.preventDefault();
              } else {
                return $scope.data;
              }
            }
          }
        ]
      });

      myPopup.then(function (res) {
        $scope.list = [];
        $scope.geoQuery();
      });
    };

    $ionicModal.fromTemplateUrl('templates/modal-map.html', function ($ionicModal) {
      $scope.modal = $ionicModal;
    }, {
        scope: $scope,
        animation: 'slide-in-up'
      });

    $scope.showMap = function (item) {

      $scope.item = item;
      $scope.modal.show();

      var myLatlng = new google.maps.LatLng(item.l[0], item.l[1]);

      var mapOptions = {
        center: myLatlng,
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      var map = new google.maps.Map(document.getElementById("map"), mapOptions);

      var marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        title: item.name
      });

      $scope.map = map;
    };

    $scope.shouldShowButton = true;
    $scope.showHome = false;
  })

  .controller('DashDetailCtrl', function ($scope, $stateParams, $firebaseObject, $firebaseArray) {
    var profissional = $stateParams.dashId;
    var root = firebase.database().ref();
    $scope.profiles = [];
    $scope.profiles = $firebaseArray(root.child('profissionais').orderByChild('id').equalTo(profissional));
    var estado_cidade = $scope.profiles.cidade_bairro;
    console.log('aqui')
    console.log($scope.profiles)
    console.log($stateParams)

  })

  .controller('ChatsCtrl', function ($scope, UserService, $firebaseObject) {
    var auth = JSON.parse(UserService.getProfile());
    var root = firebase.database().ref();
    var profile = auth.displayName;
    var arraytipo = profile.split('_');
    var tipo = arraytipo[1];
    if (tipo == "profissionais") {
      tipo = "profissional";
    }
    // var arraytipo  = profile.split('_');
    // var tipo = arraytipo[1];
    console.log(auth)



    $scope.chats = [];
    $scope.chats = $firebaseObject(root.child('chat').orderByChild(tipo).equalTo(auth.uid));

  })

  .controller('ConfigurationCtrl', function ($scope, UserService) {


  })

  .controller('TabCtrl', function ($scope, UserService, $state) {
    var auth = JSON.parse(UserService.getProfile());
    var profile = auth.displayName;
    var arraytipo = profile.split('_');
    var tipo = arraytipo[1];
    $scope.addressShow = false

    if (tipo == "profissionais") {
      $scope.addressShow = true;
    }

    $scope.logout = function () {
      firebase.auth().signOut().then(function () {
        UserService.logout();
        $state.go("login");

      }, function (error) {
        // An error happened.
        console.log(error);
      });
    }
  })

  .controller('ChatDetailCtrl', function ($scope, $stateParams, UserService, $firebaseObject, $firebaseArray, $firebaseAuth) {
    var profissional = $stateParams.chatId;
    var auth = JSON.parse(UserService.getProfile());
    var profissional_aluno = profissional + "_" + auth.uid;
    var root = firebase.database().ref();
    var objMessage = {};
    $scope.chats = [];
    $scope.total = 0;

    var userAuth = $firebaseAuth();

    userAuth.$onAuthStateChanged(function (firebaseUser) {
      $scope.firebaseUser = firebaseUser;
    });


    var chat = $firebaseArray(root.child('chat').orderByChild('profissional_aluno').equalTo(profissional_aluno));
    console.log(chat.length)

    //if(chat.length > 0){


    chat.$loaded(
      function (data) {
        if (data.length > 0) {
          var key = data[0].$id;
          $scope.total = 1;
          //var key = Object.keys(data)[0];
          console.log(key)
          $scope.chats = $firebaseArray(root.child('conversas').orderByChild('id').equalTo(key));
        }
      },
      function (error) {
        console.error("Error:", error);
      }

    );
    //}



    function dataAtual() {
      var today = new Date();
      var dd = today.getDate();
      var mm = today.getMonth() + 1; //January is 0!
      var yyyy = today.getFullYear();
      if (dd < 10) {
        dd = '0' + dd;
      }
      if (mm < 10) {
        mm = '0' + mm;
      }
      return today = dd + '/' + mm + '/' + yyyy;
    }

    $scope.sendMessage = function () {
      var data = dataAtual();
      var refChat = root.child('chat');
      var list = $firebaseArray(refChat);
      var myconversas = $firebaseArray(root.child('conversas'));
      var id = '';
      if ($scope.total == 0) {

        //$scope.chats = myconversas;

        list.$add({ aluno: auth.uid, profissional: profissional, profissional_aluno: profissional_aluno, last_msg: $scope.data.message, photoURLAluno: '', photoURLProfissional: '' }).then(function (refChat) {
          //console.log(refChat.key)
          id = refChat.key;
          $scope.chats = $firebaseArray(root.child('conversas').orderByChild('id').equalTo(id));
          $scope.chats.$add({ id: id, nome: auth.displayName, photoURL: auth.photoURL, texto: $scope.data.message }).then(function (conversaRef) {
            //console.log(refChat.key)
            var id = conversaRef.key;
            console.log("added record with id " + id);
            //list.$indexFor(id); // returns location in the array
          }, function (err) {
            console.log(err)
          });



        }, function (err) {
          console.log(err)
        });



      } else {
        id = $scope.chats[Object.keys($scope.chats)[0]].id


        $scope.chats.$add({ id: id, nome: auth.displayName, photoURL: auth.photoURL, texto: $scope.data.message }).then(function (conversaRef) {
          //console.log(refChat.key)
          var id = conversaRef.key;
          console.log("added record with id " + id);
          //list.$indexFor(id); // returns location in the array
        }, function (err) {
          console.log(err)
        });
      }

    }


  })


  .controller('AccountDetailCtrl', function ($scope, $stateParams, $firebaseObject, $firebaseArray, $q, $cordovaCamera, $ionicPlatform, UserService) {
    var id = $stateParams.accountId;
    var root = firebase.database().ref();
    $scope.perfil = false;
    $scope.myTab = { 'tab': 1 };
    $scope.user = {};
    $scope.Optionsexo = [{ name: 'Masculino', id: 1 }, { name: 'Feminino', id: 2 }];
    var auth = JSON.parse(UserService.getProfile());
    var profile = auth.displayName;
    var arraytipo = profile.split('_');
    var tipo = arraytipo[1];

    console.log(tipo)

    if (tipo == "aluno") {
      $dados = $firebaseArray(root.child('alunos').orderByChild('id').equalTo(id));
    } else {
      $scope.perfil = true;
      $dados = $firebaseArray(root.child('profissionais').orderByChild('id').equalTo(id));
    }
    $dados.$loaded(
      function (data) {
        //console.log(data)
        var key = Object.keys(data)[0];
        firebaseId = data[0].$id;
        $scope.user.photoURL = data[0].photoURL;
        $scope.user.nome = data[0].nome;
        $scope.user.sobrenome = data[0].sobrenome;
        $scope.user.email = data[0].email;
        $scope.user.password = data[0].password;
        $scope.user.id = data[0].id;
        var str_birthday = data[0].nascimento.split('-');

        var bairro_cidade = data[0].estado_cidade.split('_');
        var dateformat = str_birthday[2] + '/' + str_birthday[1] + '/' + str_birthday[0];
        //console.log(dateformat);
        var maisformat = dateformat.split('/');
        //console.log(maisformat)
        //scope.user.nascimento = dateformat;
        $scope.user.nascimento = new Date(maisformat[0] + '/' + maisformat[1] + '/' + maisformat[2]);
        //console.log($scope.user.nascimento)
        $scope.user.estado = bairro_cidade[1] + ',' + bairro_cidade[0];
        $scope.user.sexo = data[0].sexo;
        //$scope.user.photoURL = data[0].photoURL;
        $scope.user.picture = data[0].imagem;

      },
      function (error) {
        console.error("Error:", error);
      }
    );

    var geocoder = new google.maps.Geocoder();
    $scope.getAddressSuggestions = function (queryString) {
      var defer = $q.defer();
      geocoder.geocode(
        {
          address: queryString,
          componentRestrictions: { country: 'BR' }
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

    $ionicPlatform.ready(function () {
      if (typeof (Camera) != 'undefined') {
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
          correctOrientation: true
        };
      }

      $scope.choosePicture = function () {
        $cordovaCamera.getPicture(options).then(function (imageData) {
          $scope.user.picture = "data:image/jpeg;base64," + imageData;
        }, function (err) {
          console.log(err)
        });
      }
    });

    $scope.editar = function (user) {
      var dadosLocal = user.estado;
      //console.log(dadosLocal)
      if (typeof dadosLocal === 'object') {
        var cidade = dadosLocal.address_components[0].short_name;
        var estado = dadosLocal.address_components[1].short_name;
      } else {
        var localizacao = dadosLocal.split(',');
        var cidade = localizacao[1];
        var estado = localizacao[0];
      }

      var estado_cidade = cidade + "_" + estado;

      //console.log(firebaseId)
      if (tipo == "alunos") {
        var usuarios = root.child('alunos/');
      } else {
        var usuarios = root.child('profissionais/');
      }

      // if(user.tipo =='aluno')
      //   var usuarios = root.child('alunos/'+firebaseId);
      // else
      //   var usuarios = root.child('profissionais/'+firebaseId);
      var data = new Date(new Date(user.nascimento));
      var year = data.getFullYear();
      var month = data.getMonth() + 1 //getMonth is zero based;
      var day = data.getDate();
      var months = { "1": "01", "2": "02", "3": "03", "4": "04", "5": "05", "6": "06", "7": "07", "8": "08", "9": "09", "10": "10", "11": "11", "12": "12" };
      var formatted = day + "-" + months[month] + "-" + year;

      editUsers = {
        nome: user.nome,
        sobrenome: user.sobrenome,
        sexo: user.sexo,
        email: user.email,
        nascimento: formatted,
        estado: estado,
        cidade: cidade,
        estado_cidade: estado_cidade,
        id: user.id,
        imagem: user.picture
      };

      console.log(editUsers)
      usuarios.child(firebaseId).set(editUsers);
      // $dados.$save(editUsers).then(function(usuarios) {
      //   //ref.key === $dados.$id; // true
      //   console.log('atualizou')
      // }, function(error) {
      //   console.log("Error:", error);
      // });

    }

  })
  .controller('MenuController', function ($scope, $ionicSideMenuDelegate) {
    $scope.toggleLeft = function () {
      $ionicSideMenuDelegate.toggleLeft();
    };
  })
  .controller('AccountCtrl', function ($scope, $firebaseAuth, $firebaseArray, UserService, $ionicSideMenuDelegate) {

    $scope.profiles = {
      'cidade': '',
      'estado': '',
      'estado_cidade': ''
    }
    var auth = JSON.parse(UserService.getProfile());
    console.log(auth)
    var profile = auth.displayName;
    var arraytipo = profile.split('_');
    var tipo = arraytipo[1];
    var root = firebase.database().ref();
    $scope.profileType = 0;
    if (tipo == "aluno") {
      $scope.profileType = 1;
      $scope.profiles = $firebaseArray(root.child('alunos').orderByChild('id').equalTo(auth.uid));
    } else {
      $scope.profileType = 2;
      $scope.profiles = $firebaseArray(root.child('profissionais').orderByChild('id').equalTo(auth.uid));
    }

  })
  .controller('FormCtrl', function ($scope, $state, $firebaseAuth, $firebaseArray, UserService, $ionicPopup) {

    $scope.modalidades = [
      'Artes Marciais',
      'Atividades aquáticas',
      'Cardiacos, obesos e diabéticos',
      'Ciclismo',
      'Condicionamento Físico',
      'Corrida de rua e Caminhada',
      'Cross Fit',
      'Emagrecimento',
      'Gestantes',
      'Hiit',
      'Hipertrofia',
      'Natação',
      'Personal Figth',
      'Pilates',
      'Reabilitação',
      'Treinamento Funcional',
      'Tênis',
      'Yoga',
      'Zumba Fitness'
    ]
    var root = firebase.database().ref();
    var auth = JSON.parse(UserService.getProfile());
    var profile = $firebaseArray(root.child('profissionais').orderByChild('id').equalTo(auth.uid));
    console.log(profile)
    $scope.form = {};

    $scope.save = function () {

      var lat = $scope.form.location.geometry.location.lat();
      var lng = $scope.form.location.geometry.location.lng();
      var auth = JSON.parse(UserService.getProfile());

      //console.log(auth)
      var profissional_id = auth.uid;
      //console.log(profissional_id)
      var newObj = {};
      //newObj.name = $scope.form.name;
      // newObj.img = $scope.form.img
      newObj.l = [lat, lng];
      newObj.profissional = profissional_id,
        newObj.modalidade = $scope.form.modalidades,
        //newObj.profileImg = profile[0].imagem
        console.log(newObj)
      UserService.create(newObj).then(function () {
        console.log('retorno')
        var alertPopup = $ionicPopup.alert({
          title: 'Endereco Cadastrado Com Sucesso',
          template: 'Endereco Cadastrado Com Sucesso'
        });
        $scope.form = {};
        $state.go('tab.account');
      }, function (error) {
        console.error("Error:", error);
      })
    };

    $scope.locationChangedCallback = function (location) {
      //none
    }
  });
