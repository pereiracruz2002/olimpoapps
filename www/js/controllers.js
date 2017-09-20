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
  var map;
  var markers = [];
  $scope.myModel= {'tab': 1};
  var root = firebase.database().ref();
  $scope.$watch('myModel.tab', function () {
      console.log($scope.myModel.tab)
      if ($scope.myModel.tab == 2) {
          buildMap();
      }
  })

  function buildMap() {
    
    $scope.profiles = $firebaseObject(root.child('profissionais').orderByChild('estado').equalTo('SP'));
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

.controller('DashDetailCtrl', function($scope, $stateParams,$firebaseObject) {
  var profissional = $stateParams.dashId;
  var root = firebase.database().ref();
  $scope.profiles = $firebaseObject(root.child('profissionais').orderByChild('id').equalTo(profissional));

})

.controller('ChatsCtrl', function($scope, UserService,$firebaseObject) {
  var auth = UserService.getProfile();
  var root = firebase.database().ref();
  $scope.chats  = [];
  $scope.chats = $firebaseObject(root.child('chat').orderByChild('aluno').equalTo(auth));

})

.controller('ChatDetailCtrl', function($scope, $stateParams, UserService,$firebaseObject) {
  var profissional = $stateParams.chatId;
  var auth = UserService.getProfile();
  var profissional_aluno = profissional+'_'+auth;
  var root = firebase.database().ref();
  var objMessage = {};
  $scope.chats  = {};

  var chat = $firebaseObject(root.child('chat').orderByChild('profissional_aluno').equalTo(profissional_aluno));
  chat.$loaded(
    function(data) {
      var key = Object.keys(data)[0];
      $scope.chats = $firebaseObject(root.child('conversas').orderByChild('id').equalTo(key));
      console.log($scope.chats)
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

    console.log($scope.data.message)

    // $scope.profile.$save().then(function() {
    //     alert('Profile saved!');
    //   }).catch(function(error) {
    //     alert('Error!');
    //   });

    // objMessage.unshift({data : data,id: 'exemplo3.jpg'});
    // console.log($scope.data.chat)
    // message.set({
    //   data : data,
    //   id : "1",
    //   nome : "Flavio",
    //   photoURL : "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMTEhUTExMWFRUXFRUXGBcYGB0XGBgXFxUaFxgWFxgaHSggHR0lGxcYITEhJikrLi4uGB8zODMtNygtLisBCgoKBQUFDgUFDisZExkrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrK//AABEIAMIBAwMBIgACEQEDEQH/xAAcAAABBQEBAQAAAAAAAAAAAAADAgQFBgcAAQj/xABDEAACAQMCAwYDBgUCBQIHAQABAgMABBESIQUGMRMiQVFhcQcygRQjkaGxwUJSYtHwM3IVJHPh8UOCNVNjdJKywhb/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A1UvXjvtTdZwfEeVKLZFABXOqnwY4qOjPep+DtQehjRA1ABo6mgUDS80kUqg9BpNxPoXPUkhVHmxOAPbz9M0tRSZIcyRk9F1t/wC7AUfkzUEJzNxVLSB3LAz47pxuW6qCPBM526e5rA+McYeeRpJCSxOSSSTmrP8AEzjLzXBO4jGpUXyQNjV7syn6AVQHJNAaSXIOCB+R6etMzMelPLiJQi4OSeu2PzqPag4ua4zmkYrsUBRNt5e3WhFzSa4CgUGJ/wAxQ3c+dc370hqBayEdDWo/DDmN5XNvIQTpyPAkDqdvHp+tZchHlmnXB+INbzxzKSCjgnHiOjD6qSKD6ahc43ogJoFrIHRWHRlDD2IyKeIKB2jHFQV1N96anScCqzcP98ds70Fkt32rzWc0i26CvAd6B/E1HVqbxdKMpoCq1FU0JaKooFafSupVdQUK7tcDUCcjG3gcHpipmNcLXaK9kfAoGkfzU/xtUZBJ3qktW1AkUVGoDSCjJQGDUQNQhShQGU0149c9nbyuDuFIHhu3d/enCCq18TbnRw+TzYqP3/bP0oMK5gu9chxg/so2Ub+gFRAXJ/aunl3P/mvISmkhtj1B3/Db+1AW4m2xTRV88edIkko1haGVtIIHucfhmg8GknAHvXsyqD3ckevX2rSOVvh7GzBpiWQeHy6v7D8/arXztykktni3jVOz72lV6qBhgPpk+uKDByvlmhmnlzC0Tshx5Z6gg7gj0I/Wm7oR1oBhSelCY0UChuKDkNcwB/OlxxHY465xnocHp677UiRaDZPhXzgZlFpN86L92386KOjeoHj4/rpS1818lcUFrewTMcKH0uf6HGlj7DIP0r6ThcMAVIIO4I6EHoaA8gJXBqtI2Zm96sz9KrUP+qfegs1uNhSF60WHpSB1oHcQo60GMbUZTQFQUZKCpoqmgXXV2a6ggaFcDalg0K4bagjrcd+pLTtUZanvnyxUpnagAVp0pNDFHFB4JKKj0jTS1WgMjVnHxy4mFgggB3dy5H9Krgfm35VoyR1gvxhvjJfMM92NFRfzJP4/kAfGgojbmvZk6evlihKTmuyQCxznwoPCuDuPp41ZuS7XtJ1XTkDy8NvzqD4Lw5riQIpA8yfCtj5Q4CkAGCSfE/tQWywt9Kgeg/SpSCbHWmay9Pajpg0GcfFLktnZJ7VNRfKuowMdWBHgf1rLbMDV2cqtsSMYwQc4Zcdc9dvMV9Um3V00nxwR5gjcEeoNZX8TORQM3UYwDkyY/m69p7Hxx44oMmuIFGQv0BO//f2pi4p1cTk9eo8RsdumfX1oNxPq98YPrigJADpZC2kZzgjO+MZHj08qaNS+3PjufXyoDPQLrdfhBxtZrXsNR1w4GCcnQ3Qj+nOcb7fhWEZq7fCTivY36oThZlMf/uHeTP4EfWg3+Y901WrP/VPvVgnfumq9w7eT60FqjfbHpSEO9LT5aFH1oJBKXqwaRFRlFARaKKEKKKBVdXuK6grpagXJ2olAujtQMrP5yfQfv/epRjtUTaN959D+oqRc7UClbenCtUerb05V6B2rUtWpmHpYkoJKI18w86Xxlvrlz/8AOcD2Q6F/JRX0nFNXzrz3wGSCeRyO40smD4fMSPyoKwMZ3pM7Zx6CvOgpDbmgv3w24Tq1SkdSAPYdTWtW1lhc5AUbkk4H1NU3khVjgQYx3B+dWziloJYWiLEIykbEjbyOnf8AWgHPzFaI4jEylvTcD69KkbW+jb5ZFP133rJrq0sYm7MR3ZYHGoRMc+eCw3Hr6U3vltCfu5rqNwCxDQyAgAbsSBsoA69MCg3hJcAZrprnulWAIIwQehB8DWP8J5iuLcJ9520XvkkE9Q3mPI1olrdtKupVOnAIPnmgp3OPw1jlUzW5CPkZT+E5OOvhjP5Vl19y9cQSFHQhlOMgEq3oGAx+OK3jjnHooYz2jhTjp6EVR+Oc+WbbAFtt20nqPl6euaDLLuzKDJGBnHqKaFjjGdhvj1PX9BVt4zx63mj0dnjGcMB4Z2BHiQNs+lVGgXpOBnx3HrvjI+oP4VMcpQO95bhPmEqN7BGDEn02qJMhOASSAMDJzgZJwPIZJOPU1ofwb4SXuHuD8sYMYHmzjJ/AY/Gg2O5PdNQfC27/ANamLpu4faofhA7/ANaC1K21IRt6UBtQ0FBIxtR0NN41oy0DgGlrQFNEU0Bwa6kA17QV3FN7zpR803vehoGFmO8afydKZWI3NP5BtQNlO9HV6GF3ommgWHoitQtFdpoHkYrE/i1zSZZ2tY8CKNu/tu8g65PkDtjzBrYlYisz49yCbq4nMboCJDIWZXGDKc9nq+VjnoAOhHnuGQk0mtQ498Po7SxZ5o2Eyg5nV8xg6cqoUsPmY6MkeWBnesvag1bki57SNQP5lH0HX9PzrR42GelZl8L1zCD5M2Px/wDNaaoH0oPLhD4EYPv+tRN3wITPqZsbY2JxjGCMAgYPjtVhiUNtRCir1IoIG14MkeNMa9d8D5h03HtVhhKxxNhcY8BTeKUHoc0Pis+iFj/maDLZLB+I3cmcKgbT1Jx54AIycDzA3pjxvhr2LmIQWsse5DyICWH8IBGSGx1ALdan+WciSRD6keR1Esc/Ujf0p7xHg7S5AcqPTJIP1PSgx6+mErEiJISASVG35HxqOFaBzPYQwQsuF7Q76sd7PQ7nJqq8u8Cku5NCbAYLE+WcbUDCCEsQFGSTge5rcfhrwf7Nbsjf6jMHceWVAUA+IwPHxJqF4ZyoiR9mR1yrMcAhTuQCQRqP4gVcOWLBoo8MT46QckhM93OTnO5Jz50ElffIfaorgudVSnED3D7VH8EG9BZSx015byb0sju0mJd6CRVqMlNkWjqtAcClAUNc0QGgWBXV6GrqCuAU3vRtTpDTe+6UDKwBzUg42pnw1dzUmyUDRBRgtESH+9VzjnN9tbXMMUkq9nJG5dl7zRNlezLYz3SNXQE5x4UFhVKRe3EcMZlldURerMcf+T6CqCPijCt6yAF7PQArhdMhkwCXOtlAX5h0B8apPNPMDXF3I0mto1YrHFJldC9BlVPzeZzv50E1zj8UJJB2dnqhTO8px2jei/yD8/an/wANr9uwW5u7puzN72Y1ue6xjD6st5tgHyzmsx4gAdWBjBpnHIdOMnAycZ2GepA9cD8KC9/FriLz3YjhuJriIBUA6oZQzZWMIAjkDTuAT4Z2rPMeda58N75vs9tEjAMbq4lOUD6Y47YZdvFQHdMEdc4zVf8AidwYfahNEwcTZ1lcae2QJqIC9NWpTpO+dVBK/DWT/l9tjqb9aucd6Qd8n/PGqR8Oy0aPG+Rhuh269QB18BvV8SAH3oDtxIKM7k+Q/akw2ssvflODg6Yx0X/f5n8qTcssS5yqnzPh5mu4dxmE6fv4yT4BwSaCUtVGMqQR0PuOufWkcbiJiO3QZpjxvho2ntm7OYnvFd0f/qqOvv1HnVQ5i5m4qEMRtFDN0kVtS49AcfnigNwICKUB2z2iBh4b/wAQ+hNT9y+DkeVZ1yqkr3DtPIGdI9KqDkDLhmPv3RU/zFx0QrpJOemKCpfEmXMg361c/hvYxi1Rgg1E5JODljnf6LtWU8VvmuJRtnfCjzJ2ArceWuHrDCirnGheu9BLxqB79T706DU0SiZoPOInuH2phwQ7064g3cPtTPgjb0FpztXsVAMndpUD0EpGacoKZxtTqNqAyrSwKQrUQGgUFrylA15QU/lu9NxbpNLGYmfOFzsNyF3Pnt1qpXXNE8ULPdWxAjlaKRo3VipB2JTbbcb58R5irLZyO6Iqxs6szhmJGmEiLumLZdaBth0OarPEIriO0dGRr+SSeUShvupVQogKhRkkYx8uQMqR0oG0vxEiii7WGGaZdWkuR2cavgHQzkE5wc4xUGvxA4pfSiG0RYid9KAMQB1LPIDsPPAqucY4eIISr/aoJCQ3YSqTFJ5sjDAJAwd1+tM+I2U9lIgL6XaJZAYpNwsnQFl8duntQWzjfBeKSSvEbwXBHVRPo+hiOB+Gaiofh1fkqOzRdTY3kU6didTBMkLtjPmRUfHzlfKQVuXyFKgkIxwfVlJPTbPSpnlrn3QJFuwztK6Ht1OJFGRqJA27oGQFHUetAvmrhP8Aw+3ihS21S6xJLdvHqUuukiGIkf6fTOcatxvviB4pw7VGbyHHYF1DLqBeCRusbA76c/K3iNPjVt5v5pF8vYW0jG2RO0meaMbGPGHQ7MWI1HB3O+PKnHIHCA9rfRF1ljnUKrxjVghGO+oBkYdw4I9qDM5gdTeqj9Ksfwu4XBcXoS4UlNDaRnA7TI0ZOR4asDfJxtSOB8p3F1NJGqhTArdqWzpDKcBNt8tg49qt3HeXZbXRax4cv3kKDDFhuTpG4xj8s+GKCY40kFpbScQhgjtp45FhZlXaRGcF9EfyOXIyOmAc52rPJ+a2u8RvbxLIXDrMuRIz9O/4NkHyAGB5Yqx8/cNvhw9WvZkk7OeEgqQQyMsigbKCzDOd/wCEjHjVb5BtVmvz3CVClgSMhCrK2c+B2Kj/AHGgtXCLhZkEgADEYfAwdXntvVp4TL5nwqnQILW+Mefu5t1z4N5fWrdaINW3jQOL7hiT9194/wCIdM+lF4bbzwIIhouQNIxJhGEeTqYEKQ5IOy4UDA3p/bw9KK2nIVjj+VvKgQtraykBT2E2zFVYJKvoyZIx9CPKqRztGwVVtuItNO8gRYQYzscsSxUd0BQNz5HzxVyv7VJspJGkgweoBHvuDiqhZcIt7e5CQRqJpBhiP4EByWx0UegAzgUDDlnlSe3LtOQ0jgfIcjHqcDeqdz1cKbhlznQMe7eX0rYebeNx2dsz4y2NKjxLEbf3r5/ETysWY7sSxJ9etAvgQAmV2GQrA/gc/tW1cD4/HMNjv5Vk0VsFGB/nrRbS4eJtSmg3KM+VEYVUuV+YBKoBO9XaJNvwoI7iS9zFNeDx4NS/EEGKbcOTegkHQ4r23G9GddqGAQaB6po6PTNHNGVqB6klGWSmKsaKjGgfBq6m4auoIWaOV44+x+76Eg4BHiBtt9OlVzjfH4JZTEjntYFYM+CujtFaF5F89DMhb+kkjOKmbLiEEk+lWy8casuchSrgFZEHRh0GrwOfOo7nCKKOFbq4C9vFrRSm2oOjKI2B+Ze9kj096Cu8csDa2spucy2oiht1i/8Ar4wbhepXfcHIJ8R0rIQn+da0gQfaOEdkFkMsbvLo1MTIF2DouDsFO67A6SRvVBK0EZICCaG3SnN6uMfhTYGgsfIvEWSf7P3DHdlIJQ6lhgscYAYeJxv51rnBbVbVJrbWJbnQSsTFER1XdRFGAAoIbcYzkHOcZrACxByDggggjYg5yCKuHMHFLqVbWWUuJVt0ZJFVkchiWEmrPeJDfMNutBqvBOxljmcMqG5YMjBe+uqNYypfxKlSMDG3vT+CwZ/s7HQkUErjvL/q9woJCGAKHc+J65rP+YOZbnVCnZQTEwQytE0ZEv3sKOwXfv8Ae1HugnfddgTP8u852clo8dzqtDENw2CzDO4iGgZwdtIXbagkPiZDEvDLlzhw+CurfTIzBVaM/wAPjj36gVXPhPwpo7MysMGZ2ZNt9AAXOfIlcj096hjxj/jF5BZIphskywTI1yCMZ1SN/MTjboMnfO9a20CqAFAAAwAOgHgBQZ9zzwztI9Q2dd1I8CN6bcq8eEoXVgODpYevifrV5vbAODnxrJuaeDS2kvbRZ/b60GwWveGxpxc2QdMHp771TOTOa0mjzsGBwynqD9auAvlZcqff38qCBvLG5QkRzAj+rdvbNC5e4cIHeWVsuw3YnwHh6CpHik/d28R1rN+dOa9I7GNu9jTsfM7kn/OtA0544sbqbCn7tNlHgT4t+1QCR4FJ4fddoQvj5/3q0wcuOU1EUFaR69ZqNe2LoxGk0xckdRj3oHXB+ImGZSDtkZ/Gt4sLxWjUg9cV85uRV15a5uEcWh3G3TJoNR4pdjFH4UM71nf/APpkkICuhJ/qFW7g942OoI9DQW9UpfYCotb80eDiBJAxuaAvEbiO3TtJWCpkDJ8zTqMAgEHIIzVV5o4ZPPcxF8fZEAJGd2bruKno70YG3TpQSUSUdEqLS+p3Deige9nXUIXYrqCu3VhGwHZaUkgBKYGANssjeaMNiPr1qrWEcdxfg3AaeKSPXb5GY06lkYDbUMEfSrtw9yIw8iqshGptO4z+pG9R/LsOlHCENqlkYlgVAJwcKuMkb9fHr40A+cO0ihe6twDJFFpMZXUpQsCTpBBBUAkH3+nz7I2f1r6F5j45HYRC4lQu7AJ3Ng564JPTAyRn186+e+N3iyTyyInZq7swQHIUMc46UDK5lpmW/vS5WzTjgHZfaYu3YrEHBdgMkAb5Awc742wds0Ejw7lqeZ4lMUqJI/Zh+yZgH0FgukYOSMfQ56CmV2suezleTMWY9DMSI9JOUUE4ABzsNq3vmK7x2SvchFklg0YXDpj5mDJ0Yg4GRjB6YyKqV/8AC6Wa4nkSbTGZHYNMCHYtlm2HhqONW2euPMKXxLmCGay7J4WW5WRSJldihjVcaGV2JGBgDGemcjpTAXPZySC87WZkOOyL5DSKcYll1Fgg8lyT0BXrUpzZydPw+RDcKHiYghkJKsBgvHnAIbGfD1FWH4m8Etks4biKFY2aZVBQYVo3jdgD7aFI69T57BU+Xb6SC9t7xwArSqDpAVdDAxkKo2CqP0FfQUr7GvmTUzL2Z3G5XzGR4Hy9POt55WvDc2EE2e8YwGx/Oncb81NA+ueIhT4VC8YnSVCBucdCM+BqP4ykhY74H9v2qqzcQnyVijJP8wzj+1BD8a4e0DiSM6Wz4Hw/zwNEtOeLiLYhWP4fWo3iszKx7R9T+I8AfKoUkk5NBZ+J88XMq6c6dsZzkj28M/SqwWJOScnPXxNLkjx9ent51J8t8vTXc0caK+hpFRpQjOqaj1Yjb86BjZXrwyrInVT8rDIPow8q37lm/hvLZJoxgHKsp6o46qf19iKzrm7k+BOHreW4cGJ1glVo2XJDMplYsPmZsZAyACo9TFfDzi0tvOIgSI7gHHkWXOGXAO+VKn8+lBuUFnbxo8kgXSilmJxsAM18+ca5ikmeYjCpI5bSANlB7q/QYqyc98dnWLsGbAkOSP6VPj9az7cnA6nYe9BN8ucEku5NKd1Ru7noo/c+laTYctWdvo0xdq4O7yd7Jx4L0H4V7yzwr7PbpHjvEan9WO5/tUoy9P8APCgbTcMgYkmCLJ/pH7U5g4fCBtGB7Ej67GiBKLGaBSWqDprHs7UZLYZyJJQem0hrzOKIpoHlkWjAAmkIGwDEMB7ZGaPOzuQe0K+yL+eRTaI04UUBYi2clwR5FcfmKeo/+386aRCnK0DkSHyX866hgV1BT4/iBa9kHKuJdBUqF6HHgx2xn9as3BL5bhIpopFZMYfA3zj5SM7EGvn+KfbejWfH54VdIZnjVx3lB2O2PxxtkUFg+MHEpHvmicjREqhVVsjvDJLDwY5GR6Cs7lO9OrudnJZ2LMepYkk+5O9NMUCSNjVz5T+G815Cs/apGrSadLA6ioOGPocbgb5yOlU8PggkBgCCQehA8DX0RHwuQXCXZdxEIFV4I86Rse+uMFsDGwGfLPSgqTcZuYeJOklozW8WCIY40cgBQsc7vvk6d/mGMjyrQOLJcuU7HKAjoSFIbP8AFuc7b4GapXEuLx2txdXbQ6IZrUCFJNWLxs4bUpyUONtwCAQSPKjD4hX+mJRNp7ItoOAx3BHfZs6sKSBn8zQX/wCLiwLZ6ZFdrkOmlz2kijLAviQnQuV/hOPDA6GmnJvFlTgszSyRFEiniSGQ7lxqLAeOWDpgDNZ7wnmC5e7WR3eUu8YlVzqWSMMAUkB7unGeuw67U+525VubQOvZg2xuiYmUgnUyns165HcwN/ECgq2rEW+k5wMnOrbG48v+9bH8K0lisAkyFQzdpETg645QGDDB8Tq2rPeXLAWvE4o7p1j7CXvlu9GrquV1ZK7Zwc+xrX2yAridZxI0hVkACovdKxgLnGA350HnGoBvsCNvaojj0iQWzuACQu2B4npT3it3mMt022/H/PwphxKyEsKQ5AyRt548P3oKHy7y6shM1x3jnOk/L3vPzp1cyWzXsEbiNbcO4csMIodGQk48ASCPUCp/mZBFHoxg6fm/2j9etUGOLtSutlRWIBd/lUE/MxG+Ntzjbegu0PKfDBcx8P7X7QJwWinV1LI6l9cRMfdGdKncH+Lxxi2c586W/DUjhttMsyt/pEEBVUsrHWFwDkFfE7HyNZJzFwr/AIc1uFctc4Fx2sbZh06j2XYtgFz3dRbpuBjrUXxGS4neS6kGoy65SwwAQGAfSB/KWGV6gb9N6Cx8e5znvZUjCx2yzYjl0kv2msdmJJs4DFFYkEY/IYmuAW9tdXsT24+yRQ29rNnAXs7lmVM751o40BsEZ26HNZa8uf8AOntV4+Ek6dtcxzLqga1d5RgdIjlQW6gZYnbfIXyoIPnniJmun1AAx/dMB01xsVdl9CwyPTFOPh3wft7kOw7kWGPq38I/f6VWHcsSx6kk/ic/vW1cj8F+zWqgj7x++/uRsPoNqBfMPFTEGWP/AFF0MxxkBWyM4Prj/wDIVA8Mu7uUkLMo2ByQDkdMg6TUndTAcSAIyGXs2B6EFV2P40HinCntH7aHeIndeuknwPp/nrQHl4fe6CxuckAnSoxuB0BAFP8AgvD5FAaSRnbAPzHAJG/jg0vhHGY5dtlby8/apKNMH/OlAVI80UR0uNaMqUCY1pyBSUjpzGooOiWnKCkItHRaAgFdSwK8oPmGR8DFM5Cacynzps9AbhFr29xFCWCh3VSxx3QTud/StI4ly1w3sZbZcpNbx6jckYEhwTvvh/UfhWXRTFHV1OGUhgfIg5FWyfmq94mVsyIwsjgtoBU6VGW1Ek7DBb8KCwfDzh9mFCywiY3JdYmdQ33ar3s52Ulgem/TpU1wGMWl/PDNeSIqorwqZ+1Glv8A02WRTqcADYDOMe9WKZ1NnpsolnAiZU3CoABp+bz2Ow8vCovlVEtbc3sk/wBoZ1QzttIwf5VCt1GM4IPl4eIVD4udoPssckwmYCZi6nA3cYTQCQCo2z1OfSs+lTatz5q4HZzYu7iMmNYzlhmNu82oPpXBcb4Pl+NUjn/kqOCIXdqf+VbRhWYlsvuDGCMlcY+Y56+FBC/Dbi0dtehpG0K6GMvhTp1Mu7Fxsu25Hp4Vo/MnGLCazaIzmbtZXKospMiMhYI6LGPkDKDpO2DnwrFIl3qz/DlU/wCIR65Fi2fDMoZS2n5TqIC5XVv6DzoJix4FeXbML20xLJETHd7K3aKuU7bS2l1YDTq056b1YuCcWZooLd41WWBey0xurqAVxqkZO6HOg90E4AOcZFB5yW1l+wH7OlzIdUZ7JGlK28RVXbTGwLYJGkHIGT9Z8R2agpZQLGI5olkIQIATE+GOdyTsvnnr50DHiqHGMZXWoPrnr/b6UEQEoe/g6sg9AMf+DTjixdRkgfxY8D06n6Z/GoGS8ZMatwxB38MAD8P70DTma81qEydwSd/E5B39N6qKWbAMgBJ3UAdWyDjH1wPrU0Yizk9QxyceHhsPPp/gqf5dsO/ExAZRIhx5jWNvyoIjm7lO4srCzkuBFMscsqaQz6RHOquitjSwIdZDsdiw9qj+S+BjiGIYbYKYSJHnLaxqI2WaJvmjbs9OE6bnoSK2LnpEuYooZQGge7tAGVv9RXbQwVlOQQzDf1rE5eJS8J4hcrZTAhJHjDEBgyg9GHQlTkZ8welBWpnMcxOkK6SklOqqyvnSNzlQRj2q2WzrbcIuJgMPfTmGP0gjJL4+pK/hVPKvJJgZZ3b6s7t+pJq1/E66RZYLKM5jsoEi95CNUjf/AK/nQRnI/Cu3uVyMpH32+nyj6n9K2uBs71Vfh/wXsLUMw+8lw7egx3V/CrYooKhc2jPxL0Vtf0Cr/wBqt0sYIwem1ctquvtMd7TpJ8xnPT96M0eRQUnjnAjGwePu5PToD/tPgfQ7+Wam+AcQYrpcggYCuSMknopA8fWp6JQRj6Y602bhcOT90m+M5UHoSR1HgSfbNA7jOQCKdRChIM4p1FHQKUUZVrlWjBaD1Vo6ChqtFUUC9NdSxXUHyq0g8aDI4NW7lzhsEcbXV5Gzx/KikEI2f4tQBqr8Z7IyuYARHnIGSwA9yAce9AxJrTvhrbw2kbzXKSiSUKAeyYpHA3/qGQDSoO5O+wAqi8qWazXkMbqGVn3UtpBABPzeHStx4xKi6dMwWNNULxSBtMryIBGgY+BPiCRk0Ezb26oka2xjEMilVXHdGpWYOjL5+OTv4EeMO8svD7cRtGbmGAwhpUAQquxYMmTqwMd7p3t/E1A2vMUN3ZLZxN9jZFUynfRFpbSI9ZxksxGMeX0Nm4JafYbWSO5uyTpd85AAXTp0oZAc779OpFBUb74mwrcvphZ4DEwUPp1iRupXOcRsAMrnw6eFQ/xC56S8hjitzIinHbRsq6MrgoUOSRg56YzgVUL2zcASdm4jzgMVOnfcDVjBOKj1UsQoBLHYADJJ9AOtAlTijacg+1KubKSM4kRkPkylT1wdiPPauhA6npg0EtypzG1kxeFA0z9zJ3xGQMIg/mLb5P8AKo860PiHFmmv2t4FMUNuQ1yDpAkm1hQ4IGWILjOcZwD4DOccnLm67ih5hFKbdT0Nwqao8jx2DYB21aa1KCRWtJkkEiujRu8mk6rmW2SEGZB/J3QG29c9aBXHnQOqZ3PXJyPbFV/iEOpgVbPexjO2ykkD9KmREs57ynrtjwORuSP6abXXC+yXSoJ2z6Enrjf0oI7hPDvvNIGBkEkHwIwP3qyoRbwySkgGJWk6fyjK+4yBTSK30AY6d0Z89sAH1/emXPl1osJQDktpXPmGdc/kKCp8R52lm4YLVyTLHcRyiYNhzqLyE7eIcncYxt5VSHYkkk5JJJJOSSdyST1NPLO3M0qRKQpleNAT0DMwVScDPj4Cu4lwqWCUwyJiTIAA7wbV8pQjZlbwI60Fz+HfLsKwScVuW7kHaGNAf/Uj0lWbzySQB6A+Iqtcr8Ne9vRr3BYyyn0zqI+p2q1843AtOD2lgoZXlJmcMAH0li2Gx/Xj6AeVTHww4H2Nt2zDvzd71CD5R9ev1oLSI/wpSrRuzrxUoPFWjJtXmMelKVh5j8aBjdcLVzlXkjbzRsAn1HQ0Xh3DzHnLl/UgA+pOOp/CnwFKyB1IFB4qU5iWkKKLHQFUUVRQgfOiRyA+IoCqKKtJAoiCgUBXtLArqD5RklYjSWJA6DOw9hUrwtikMbJ3WN3GpZdiV0MdJI3Iz4V1dQT/ABG2QRyuEUN2Nx3sDV0I69elA4jeyMyxtI7IeHxOULEqWCOQxUnGQQN/QV5XUA+YNrWXG2q/j1Y/i/5VW389yT7mrl8TowY7XIHzY6eBC5Fe11BJ83RKVuYyoKLZM6oR3VcZAdV6BgPEb1k/Iv8A8Rtf+sldXUGk/GhAbOByAWFy6hsb6SHJXPXGQNvQVjo6fWurqB1wGQrdwFSQRKmCDgjfGxFat8Tj97w71t70H1BtskHzGd68rqB5wc4iHsn55zTu7Peb/Z+4rq6gHaKNI28/1qnfEM/8mv8A1F//AKrq6gpHJ4zfWv8A9xF+TAj86sF0MDhpG2m+uEX0RLyPSo8lGTgdBk11dQMvidKzcTmDEsA4UAnOBnoM9B6VstsoCKAMdxf0rq6gU9D8a6uoDpXvjXV1AQUQV1dQEWlr1rq6gKtGjrq6gOlFWurqAorq6uoP/9k=",
    //   sobrenome : "Pereira",
    //   texto : $scope.data.message
    // });


  }


})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
