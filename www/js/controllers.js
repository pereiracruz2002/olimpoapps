angular.module('starter.controllers', ['ionic', 'firebase', 'ionic-numberpicker']);
App.controller('LoginCtrl', function ($scope, $state, $ionicPopup, $firebaseAuth, UserService, $q, $firebaseObject, $firebaseArray) {
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
      UserService.getFirebaseData(firebaseUser.uid, tipo, function (user) {
      })
      $scope.tipo = tipo;

      if (tipo == "aluno") {
        UserService.getFirebaseData(firebaseUser.uid, tipo, function (user) {
          $state.go('tab.dash');
        })
      } else {
        UserService.getFirebaseData(firebaseUser.uid, tipo, function (user) {
          $state.go('tab.account');
        })

      }

    }).catch(function (error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      var msgError = "";
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

  var tipoFacebook = '';

  var fbLoginSuccess = function (response) {
    if (!response.authResponse) {
      fbLoginError("Cannot find the authResponse");
      return;
    }

    var authResponse = response.authResponse;

    getFacebookProfileInfo(authResponse)
      .then(function (profileInfo) {

        $scope.data = {
          distance: 10
        };

        $scope.type = [
          'Aluno',
          'Profissional'
        ];

        var myPopupType = $ionicPopup.show({
          templateUrl: 'templates/popup-type.html',
          title: 'Escolha seu perfil',
          scope: $scope,
          buttons: [
            { text: 'Cancel' }, {
              text: '<b>Save</b>',
              type: 'button-positive',
              onTap: function (e) {
                if (!$scope.data) {
                  e.preventDefault();
                } else {
                  if ($scope.data.type === 'Profissional') {
                    tipoFacebook = 'profissionais';
                    UserService.saveProfile({
                      authResponse: authResponse,
                      uid: profileInfo.id,
                      displayName: profileInfo.name + '_' + tipoFacebook,
                      email: profileInfo.email,
                      photoURL: "http://graph.facebook.com/" + authResponse.userID + "/picture?type=large"
                    });

                    $state.go('tab.account');
                  } else {
                    tipoFacebook = 'aluno';
                    UserService.saveProfile({
                      authResponse: authResponse,
                      uid: profileInfo.id,
                      displayName: profileInfo.name + '_' + tipoFacebook,
                      email: profileInfo.email,
                      photoURL: "http://graph.facebook.com/" + authResponse.userID + "/picture?type=large"
                    });

                    $state.go('tab.dash');
                  }

                  return $scope.data.type;
                }
              }
            }
          ]
        });

      }, function (fail) {
        // Fail get profile info
      });
  };

  var fbLoginError = function (error) {
    //  $ionicLoading.hide();
  };

  var getFacebookProfileInfo = function (authResponse) {
    var info = $q.defer();

    facebookConnectPlugin.api('/me?fields=email,name&access_token=' + authResponse.accessToken, null,
      function (response) {
        info.resolve(response);
      },
      function (response) {
        info.reject(response);
      }
    );
    return info.promise;
  };

  $scope.facebookSignIn = function () {
    facebookConnectPlugin.getLoginStatus(function (success) {
      if (success.status === 'connected') {
        var user = JSON.parse(UserService.getProfile('facebook'));

        if (!user.uid) {
          getFacebookProfileInfo(success.authResponse)
            .then(function (profileInfo) {

              var myPopupType = $ionicPopup.show({
                templateUrl: 'templates/popup-type.html',
                title: 'Escolha seu perfil',
                scope: $scope,
                buttons: [
                  { text: 'Cancel' }, {
                    text: '<b>Save</b>',
                    type: 'button-positive',
                    onTap: function (e) {
                      if (!$scope.data.type) {
                        e.preventDefault();
                      } else {
                        return $scope.data.type;
                      }
                    }
                  }
                ]
              });

              myPopupType.then(function (resposta) {
                $scope.list = [];
              });

              UserService.saveProfile({
                authResponse: authResponse,
                uid: profileInfo.id,
                displayName: profileInfo.name + "_" + tipoFacebook,
                email: profileInfo.email,
                photoURL: "http://graph.facebook.com/" + authResponse.userID + "/picture?type=large"
              });

              $state.go('tab.dash');
            }, function (fail) {
              // Fail get profile info
            });
        } else {
          $state.go('tab.dash');
        }
      } else {
        facebookConnectPlugin.login(['email', 'public_profile'], fbLoginSuccess, fbLoginError);
      }
    });
  };

  $scope.resetPassword = function (user) {

    if (user == null || user == undefined) {
      var alertPopup = $ionicPopup.alert({
        title: 'Campo obrigatório',
        template: 'Digite seu e-mail'
      });
    } else {
      var emailAddress = user.email;
      var alertPopup = $ionicPopup.alert({
        title: 'E-mail de refinição de senha enviado',
        template: 'Um link para redefinição de sua senha foi enviado no seu e-mail cadastrado.'
      });
      auth.$sendPasswordResetEmail(emailAddress).then(function () {
      }).catch(function (error) {
        // An error happened.
      });
    }

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

    var tipoFacebook = '';

    var fbLoginSuccess = function (response) {
      if (!response.authResponse) {
        fbLoginError("Cannot find the authResponse");
        return;
      }

      var authResponse = response.authResponse;

      getFacebookProfileInfo(authResponse)
        .then(function (profileInfo) {
          $scope.data = {
            distance: 10
          };
          $scope.type = [
            'Aluno',
            'Profissional'
          ];

          var myPopupType = $ionicPopup.show({
            templateUrl: 'templates/popup-type.html',
            title: 'Escolha seu perfil',
            scope: $scope,
            buttons: [
              { text: 'Cancel' }, {
                text: '<b>Save</b>',
                type: 'button-positive',
                onTap: function (e) {
                  if (!$scope.data) {
                    e.preventDefault();
                  } else {
                    if ($scope.data.type === 'Profissional') {
                      tipoFacebook = 'profissionais';
                      UserService.saveProfile({
                        authResponse: authResponse,
                        uid: profileInfo.id,
                        displayName: profileInfo.name + '_' + tipoFacebook,
                        email: profileInfo.email,
                        photoURL: "http://graph.facebook.com/" + authResponse.userID + "/picture?type=large"
                      });
                      console.log("passa0")
                      $state.go('tab.account');
                    } else {
                      tipoFacebook = 'aluno';
                      UserService.saveProfile({
                        authResponse: authResponse,
                        uid: profileInfo.id,
                        displayName: profileInfo.name + '_' + tipoFacebook,
                        email: profileInfo.email,
                        photoURL: "http://graph.facebook.com/" + authResponse.userID + "/picture?type=large"
                      });
                      console.log("passa1")
                      $state.go('tab.dash');
                    }
                    return $scope.data.type;
                  }
                }
              }
            ]
          });
        }, function (fail) {
          // Fail get profile info
        });
    };

    var fbLoginError = function (error) {
      //  $ionicLoading.hide();
    };

    var getFacebookProfileInfo = function (authResponse) {
      var info = $q.defer();

      facebookConnectPlugin.api('/me?fields=email,name&access_token=' + authResponse.accessToken, null,
        function (response) {
          info.resolve(response);
        },
        function (response) {
          info.reject(response);
        }
      );
      return info.promise;
    };

    $scope.facebookSignIn = function () {
      facebookConnectPlugin.getLoginStatus(function (success) {
        if (success.status === 'connected') {
          var user = JSON.parse(UserService.getProfile('facebook'));

          if (!user.uid) {
            getFacebookProfileInfo(success.authResponse)
              .then(function (profileInfo) {
                var myPopupType = $ionicPopup.show({
                  templateUrl: 'templates/popup-type.html',
                  title: 'Escolha seu perfil',
                  scope: $scope,
                  buttons: [
                    { text: 'Cancel' }, {
                      text: '<b>Save</b>',
                      type: 'button-positive',
                      onTap: function (e) {
                        if (!$scope.data.type) {
                          e.preventDefault();
                        } else {
                          return $scope.data.type;
                        }
                      }
                    }
                  ]
                });

                myPopupType.then(function (resposta) {
                  $scope.list = [];
                });

                UserService.saveProfile({
                  authResponse: authResponse,
                  uid: profileInfo.id,
                  displayName: profileInfo.name + "_" + tipoFacebook,
                  email: profileInfo.email,
                  photoURL: "http://graph.facebook.com/" + authResponse.userID + "/picture?type=large"
                });
                $state.go('tab.dash');
              }, function (fail) {
                // Fail get profile info
              });
          } else {
            $state.go('tab.dash');
          }
        } else {
          facebookConnectPlugin.login(['email', 'public_profile'], fbLoginSuccess, fbLoginError);
        }
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

  })
  .controller('DashCtrl', function ($scope, $firebaseArray, $timeout, $ionicModal, $ionicPopup, $ionicLoading, UserService) {
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
    $scope.tresItens = [];

    var myPopupEspecialidades = $ionicPopup.show({
      templateUrl: 'templates/popup-especialidades.html',
      title: 'Especialidades',
      cssClass: 'popup-pin',
      scope: $scope,
      buttons: [
        { text: 'Cancel' }, {
          text: '<b>Save</b>',
          type: 'button-positive',
          onTap: function (e) {
            if ($scope.tresItens.length < 4) {
              if (!$scope.data) {
                e.preventDefault();
              } else {
                console.log($scope.tresItens)
                return $scope.tresItens;
              }
            } else {
              $ionicLoading.show({ template: 'Por favor, escolha no máximo três modalidades', noBackdrop: true, duration: 2000 });
              e.preventDefault();
            }
          }
        }
      ]
    });

    myPopupEspecialidades.then(function (resposta) {
      $scope.list = [];
      $scope.tresItens = [];
      $scope.FilterByEspecialides(resposta);
      //$scope.geoQuery();
    });

    $scope.validaOpcoes = function (item) {
      var idx = $scope.tresItens.indexOf(item);
      console.log(item)
      if (idx > -1) {
        console.log("1" + $scope.tresItens)
        $scope.tresItens.splice(idx, 1);
      }
      else {
        console.log("2" + $scope.tresItens)
        $scope.tresItens.push(item);
      }

    }

    $scope.FilterByEspecialides = function (resposta) {

      $scope.list = $firebaseArray(root.child('enderecos').orderByChild('modalidade').equalTo(resposta));

    }

    $scope.locationChangedCallback = function (location) {
      $scope.list = [];
      $scope.lat = location.geometry.location.lat();
      $scope.lng = location.geometry.location.lng();
      $scope.geoQuery();
    };

    $scope.geoQuery = function () {

      var geoQuery = UserService.getByGeo($scope.lat, $scope.lng, $scope.data.distance);
      geoQuery.on("key_entered", function (key, location, distance) {
        $timeout(function () {

          UserService.get(key).then(function (restaurant) {
            restaurant.distance = distance.toFixed(2);
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

      var myPopup = $ionicPopup.show({
        templateUrl: 'templates/popup-especialidades.html',
        title: 'Especialidades',
        scope: $scope,
        cssClass: 'popup-pin',
        buttons: [
          { text: 'Cancelar' }, {
            text: '<b>Salvar</b>',
            type: 'button-positive',
            onTap: function (e) {
              if ($scope.tresItens.length < 4) {
                if (!$scope.data) {
                  e.preventDefault();
                } else {
                  console.log($scope.tresItens)
                  return $scope.tresItens;
                }
              } else {
                $ionicLoading.show({ template: 'Por favor, escolha no máximo três modalidades', noBackdrop: true, duration: 2000 });
                e.preventDefault();
              }
            }
          }
        ]
      });

      myPopup.then(function (res) {
        $scope.list = [];
        $scope.tresItens = [];
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

    chat.$loaded(
      function (data) {
        if (data.length > 0) {
          var key = data[0].$id;
          $scope.total = 1;
          //var key = Object.keys(data)[0];
          $scope.chats = $firebaseArray(root.child('conversas').orderByChild('id').equalTo(key));
        }
      },
      function (error) {
        console.error("Error:", error);
      }

    );

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
        list.$add({ aluno: auth.uid, profissional: profissional, profissional_aluno: profissional_aluno, last_msg: $scope.data.message, photoURLAluno: '', photoURLProfissional: '' }).then(function (refChat) {
          id = refChat.key;
          $scope.chats = $firebaseArray(root.child('conversas').orderByChild('id').equalTo(id));
          $scope.chats.$add({ id: id, nome: auth.displayName, photoURL: auth.photoURL, texto: $scope.data.message }).then(function (conversaRef) {
            var id = conversaRef.key;
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
          var id = conversaRef.key;
          //list.$indexFor(id); // returns location in the array
        }, function (err) {
          console.log(err)
        });
      }
    }
  })

  .controller('AccountDetailCtrl', function ($scope, $state, $stateParams, $firebaseObject, $firebaseArray, $q, $cordovaCamera, $ionicPlatform, UserService, $ionicPopup) {
    var id = $stateParams.accountId;
    var root = firebase.database().ref();
    $scope.perfil = false;
    $scope.myTab = { 'tab': 1 };
    $scope.Optionsexo = [{ name: 'Masculino', id: 1 }, { name: 'Feminino', id: 2 }];
    var auth = JSON.parse(UserService.getProfile());
    var profile = auth.displayName;
    var arraytipo = profile.split('_');
    var tipo = arraytipo[1];

    $scope.especialidades = [
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
    ];

    $scope.user = JSON.parse(UserService.getProfileData());
    $scope.user.dateFormatted = new Date($scope.user.nascimento);
    $scope.address = JSON.parse(localStorage.getItem("user.current_user_address"));
    $scope.place = JSON.parse(localStorage.getItem("user.current_user_place"));
    $scope.age = JSON.parse(localStorage.getItem("user.current_user_age"));
    $scope.price = JSON.parse(localStorage.getItem("user.current_user_price"));
    $scope.acts = JSON.parse(localStorage.getItem("user.current_user_acts"));

    if (tipo == "aluno") {
      $dados = $firebaseArray(root.child('alunos').orderByChild('id').equalTo(id));
    } else {
      $scope.perfil = true;
      $dados = $firebaseArray(root.child('profissionais').orderByChild('id').equalTo(id));
    }

    if (tipo == "profissionais") {
      $scope.numberPickerValorMin = {
        inputValue: $scope.price.valor_min,
        minValue: 1,
        maxValue: 100,
        step: 3,
        format: "WHOLE",
        setLabel: 'Ok',
        closeLabel: 'Cancelar',
        setButtonType: 'button-positive',
        closeButtonType: 'button-stable',
        callback: function (val) {
          console.log(val)
          if (val == undefined || val == null) {
            console.log('nao')
          } else {
            $scope.price.valor_min = val;
          }
        }
      };

      $scope.numberPickerValorMax = {
        inputValue: $scope.price.valor_max,
        minValue: 1,
        maxValue: 100,
        step: 3,
        format: "WHOLE",
        setLabel: 'Ok',
        closeLabel: 'Cancelar',
        setButtonType: 'button-positive',
        closeButtonType: 'button-stable',
        callback: function (val) {
          if (val == undefined || val == null) {
            console.log('nao')
          } else {
            $scope.price.valor_max = val;
          }
        }
      };

      $scope.numberPickerIdadeMin = {
        inputValue: $scope.age.idade_min,
        minValue: 1,
        maxValue: 100,
        step: 3,
        format: "WHOLE",
        setLabel: 'Ok',
        closeLabel: 'Cancelar',
        setButtonType: 'button-positive',
        closeButtonType: 'button-stable',
        callback: function (val) {
          if (val == undefined || val == null) {
            console.log('nao')
          } else {
            $scope.age.idade_min = val;
          }
        }
      };

      $scope.numberPickerIdadeMax = {
        inputValue: $scope.age.idade_max,
        minValue: 1,
        maxValue: 100,
        step: 3,
        format: "WHOLE",
        setLabel: 'Ok',
        closeLabel: 'Cancelar',
        setButtonType: 'button-positive',
        closeButtonType: 'button-stable',
        callback: function (val) {
          if (val == undefined || val == null) {
            console.log('nao')
          } else {
            $scope.age.idade_max = val;
          }
        }
      };
    }

    $dados.$loaded(
      function (data) {
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
        var maisformat = dateformat.split('/');
        //scope.user.nascimento = dateformat;
        $scope.user.nascimento = new Date(maisformat[0] + '/' + maisformat[1] + '/' + maisformat[2]);
        $scope.user.estado = bairro_cidade[1] + ',' + bairro_cidade[0];
        $scope.user.sexo = data[0].sexo;
        //$scope.user.photoURL = data[0].photoURL;
        $scope.user.picture = data[0].imagem;
        console.error("data:", data);

      },
      function (error) {
        console.error("Error:", error);
      }
    );

    $scope.addBairro = function () {

      var myPopup = $ionicPopup.prompt({
        title: 'Novo endereço',
        subTitle: 'Digite um novo bairro',
        inputType: 'text',
        inputPlaceholder: 'Ex.: Vila Mariana'
      }).then(function (res) {
        console.log('Your name is', res);
        $scope.place.bairro.push(res);
      });

    };

    $scope.locationChangedCallback = function (location) {

      var nomePopup = $ionicPopup.prompt({
        title: 'Modalidade',
        subTitle: 'Digite a modalidade atendida',
        inputType: 'text',
        inputPlaceholder: 'Ex.: Hipertrofia'
      }).then(function (res) {
        console.log('Your name is', res);
        $scope.address.modalidade = res;

        $scope.list = [];
        $scope.lat = location.geometry.location.lat();
        $scope.lng = location.geometry.location.lng();
        $scope.address.push({
          'g': "",
          'l': [String($scope.lat), String($scope.lng)],
          'modalidade': $scope.address.modalidade,
          'name': $scope.address.name,
          'location': location.formatted_address,
          'profileImg': ""
        });
      });

      var modalidadePopup = $ionicPopup.prompt({
        title: 'Nome do local',
        subTitle: 'Digite o nome do local',
        inputType: 'text',
        inputPlaceholder: 'Ex.: Academia'
      }).then(function (res) {
        console.log('Your name is', res);
        $scope.address.name = res;
      });
      console.log($scope.address)
    };

    $scope.deleteRow = function (row) {
      var index = $scope.place.bairro.indexOf(row);
      console.log(index)
      if (index > -1) {
        $scope.place.bairro.splice(index, 1);
      }
    }

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

      $scope.removePicture = function () {
        console.log('remove')
        $scope.user.picture = "icon ion-ios-camera";
      }

    });

    $scope.editar = function (user) {
      var dadosLocal = user.estado;
      var cidade = '';
      var estado = '';
      var localizacao = '';
      if (typeof dadosLocal === 'object') {
        cidade = dadosLocal.address_components[0].short_name;
        estado = dadosLocal.address_components[1].short_name;
      } else {
        localizacao = dadosLocal.split(',');
        cidade = localizacao[1];
        estado = localizacao[0];
      }

      var estado_cidade = user.cidade + "_" + user.estado;

      if (tipo == "aluno") {
        var usuarios = root.child('alunos/');
      } else {
        var usuarios = root.child('profissionais/').child($scope.user.key);
        var enderecos = root.child('enderecos/').child($scope.user.key);
        var bairros = root.child('profissionais_bairro/').child($scope.place.key);
        var idade = root.child('profissionais_idade/').child($scope.age.key);
        var treinos = root.child('profissionais_treinos/').child($scope.acts.key);
        var valor = root.child('profissionais_valor/').child($scope.price.key);
      }

      var data = new Date(new Date(user.nascimento));
      var year = data.getFullYear();
      var month = data.getMonth() + 1 //getMonth is zero based;
      var day = data.getDate();
      var months = { "1": "01", "2": "02", "3": "03", "4": "04", "5": "05", "6": "06", "7": "07", "8": "08", "9": "09", "10": "10", "11": "11", "12": "12" };
      var formatted = day + "-" + months[month] + "-" + year;

      if (tipo == "aluno") {
        editUsers = {
          nome: user.nome,
          sobrenome: user.sobrenome,
          sexo: user.sexo,
          email: user.email,
          nascimento: formatted,
          estado: user.estado,
          cidade: user.cidade,
          estado_cidade: estado_cidade,
          id: auth.uid,
          imagem: user.picture
        };
      } else {
        editUsers = {
          nome: user.nome,
          sobrenome: user.sobrenome,
          sexo: user.sexo,
          email: user.email,
          nascimento: formatted,
          estado: user.estado,
          cidade: user.cidade,
          estado_cidade: estado_cidade,
          id: auth.uid,
          imagem: user.picture,
          formacao: user.formacao,
          descricao: user.descricao,
          atende_fora: false,
          perfil_views: ''
        };
      }

      $scope.user.picture = user.picture;
      $scope.user.nome = user.nome;
      $scope.user.email = user.email;
      $scope.user.sobrenome = user.sobrenome;
      $scope.user.estado = user.estado;
      $scope.user.cidade = user.cidade;
      $scope.user.formacao = user.formacao;
      $scope.user.descricao = user.descricao;
      $scope.user.nascimento = formatted;
      $scope.user.sexo = user.sexo;

      UserService.saveProfileData("user.current_user_data", $scope.user);

      if (tipo == "profissionais") {
        editEnderecos = {
          enderecos: $scope.address
        };

        editBairros = {
          profissional_id: auth.uid,
          bairro: $scope.place.bairro
        };

        editIdade = {
          profissional_id: auth.uid,
          idade_min: $scope.age.idade_min,
          idade_max: $scope.age.idade_max
        };

        editTreinos = {
          profissional_id: auth.uid,
          treinos: $scope.acts.treinos
        };

        editValor = {
          profissional_id: auth.uid,
          valor_min: $scope.price.valor_min,
          valor_max: $scope.price.valor_max
        };

        bairros.update(editBairros);
        idade.update(editIdade);
        treinos.update(editTreinos);
        valor.update(editValor);

        UserService.saveProfileData("user.current_user_address", editEnderecos.enderecos);
        UserService.saveProfileData("user.current_user_place", editBairros);
        UserService.saveProfileData("user.current_user_age", editIdade);
        UserService.saveProfileData("user.current_user_price", editValor);
        UserService.saveProfileData("user.current_user_acts", editTreinos);

      }

      usuarios.update(editUsers);
      $state.reload('tab.account');
      $state.go('tab.account');

    }

  })
  .controller('MenuController', function ($scope, $ionicSideMenuDelegate) {
    $scope.toggleLeft = function () {
      $ionicSideMenuDelegate.toggleLeft();
    };
  })
  .controller('AccountCtrl', function ($scope, $firebaseAuth, $firebaseArray, UserService, $ionicSideMenuDelegate, $firebaseObject) {

    var auth = JSON.parse(UserService.getProfile());
    console.log(JSON.stringify(auth))
    var profile = auth.displayName;
    var arraytipo = profile.split('_');
    var tipo = arraytipo[1];
    var root = firebase.database().ref();
    var viaFacebook = false;

    $scope.user = JSON.parse(UserService.getProfileData());
    $scope.address = JSON.parse(localStorage.getItem("user.current_user_address"));
    $scope.place = JSON.parse(localStorage.getItem("user.current_user_place"));
    $scope.age = JSON.parse(localStorage.getItem("user.current_user_age"));
    $scope.price = JSON.parse(localStorage.getItem("user.current_user_price"));
    $scope.acts = JSON.parse(localStorage.getItem("user.current_user_acts"));

    console.log($scope.address);

    if ($scope.user == null) {
      viaFacebook = true;
      $scope.user = {
        'key': auth.uid,
        'picture': auth.photoURL,
        'nome': arraytipo[0],
        'sobrenome': '',
        'cidade': '',
        'estado': '',
        'disponibilidade': false,
        'descricao': '',
        'email': auth.email,
        'formacao': '',
        'nascimento': '',
        'perfil_views': '',
        'sexo': ''
      };

      $scope.address = [{
        'key': auth.uid,
        'g': '',
        'l': ['', ''],
        'location': '',
        'modalidade': '',
        'name': '',
        'profileImg': ''
      }];

      $scope.place = {
        'key': auth.uid,
        'bairro': ''
      };

      $scope.age = {
        'key': auth.uid,
        'idade_min': '',
        'idade_max': ''
      };

      $scope.price = {
        'key': auth.uid,
        'valor_min': '',
        'valor_max': ''
      };

      $scope.acts = {
        'key': auth.uid,
        'treinos': ''
      };

      UserService.saveProfileData("user.current_user_data", $scope.user);
      UserService.saveProfileData("user.current_user_address", $scope.address);
      UserService.saveProfileData("user.current_user_place", $scope.place);
      UserService.saveProfileData("user.current_user_age", $scope.age);
      UserService.saveProfileData("user.current_user_price", $scope.price);
      UserService.saveProfileData("user.current_user_acts", $scope.acts);
    }

    $scope.profileType = 0;
    if (tipo == "aluno") {
      $scope.profileType = 1;
    } else {
      $scope.profileType = 2;
      var usuarios = root.child('profissionais/').child($scope.user.key);

      if (viaFacebook == false) {


        var views = parseInt($scope.user.perfil_views) + 1;
console.log(views)
        editViews = {
          perfil_views: views
        }

        usuarios.update(editViews);

      }

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
    $scope.form = {};

    $scope.save = function () {

      var lat = $scope.form.location.geometry.location.lat();
      var lng = $scope.form.location.geometry.location.lng();
      var auth = JSON.parse(UserService.getProfile());

      var profissional_id = auth.uid;
      var newObj = {};
      newObj.l = [lat, lng];
      newObj.profissional = profissional_id,
        newObj.modalidade = $scope.form.modalidades,
        UserService.create(newObj).then(function () {
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
    }
  });
