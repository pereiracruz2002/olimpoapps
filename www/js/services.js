angular.module('starter.services', ['firebase', 'ionic-numberpicker'])

App.service('UserService', function ($http, URL_API, $httpParamSerializerJQLike, $firebaseArray, $q) {

    var service = this,
        database = firebase.database().ref("enderecos"),
        objects = $firebaseArray(database);


    service.getProfile = function () {
        var user = localStorage.getItem("user.current_user");
        return user;
    }

    service.getProfileData = function () {
        var user = localStorage.getItem("user.current_user_data");
        console.log("user no service " + JSON.stringify(user))
        return user;
    }

    service.saveProfile = function (user) {
        localStorage.setItem("user.current_user", JSON.stringify(user));
    }

    service.saveProfileData = function (key, user) {
        localStorage.setItem(key, JSON.stringify(user));
    }

    service.logout = function () {
        localStorage.removeItem('user.current_user');

    }

    service.getFirebaseData = function (uid, tipo, callback) {
        var user = {};

        if(tipo == "profissionais") {
            var profissionais = [];
            var enderecos = [];
            var bairro = [];
            var idade = [];
            var treinos = [];
            var valor = [];
            profissionais = firebase.database().ref('profissionais').orderByChild('id').equalTo(uid);
            profissionais.once('value').then(function (snapshot) {
                snapshot.forEach(function (childSnapshot) { 
                    var key = childSnapshot.key;
                    var childData = childSnapshot.val();
                    user = {
                        'key': key,
                        'picture': childData.imagem,
                        'nome': childData.nome,
                        'sobrenome': childData.sobrenome,
                        'cidade': childData.cidade,
                        'estado': childData.estado,
                        'disponibilidade': childData.atende_fora,
                        'descricao': childData.descricao,
                        'email': childData.email,
                        'formacao': childData.formacao,
                        'nascimento': childData.nascimento,
                        'perfil_views': childData.perfil_views,
                        'sexo': childData.sexo
                    }
                });
                service.saveProfileData("user.current_user_data", user);
           //     callback(user);
            });

            profissionais = firebase.database().ref('enderecos').orderByChild('profissional_id').equalTo(uid);
            profissionais.once('value').then(function (snapshot) {
                snapshot.forEach(function (childSnapshot) {
                    var key = childSnapshot.key;
                    var childData = childSnapshot.val();
                    user = childData.enderecos;
                });
                service.saveProfileData("user.current_user_address", user);
           //     callback(user);
            });

            profissionais = firebase.database().ref('profissionais_bairro').orderByChild('profissional_id').equalTo(uid);
            profissionais.once('value').then(function (snapshot) {
                snapshot.forEach(function (childSnapshot) {
                    var key = childSnapshot.key;
                    var childData = childSnapshot.val();
                    user = {
                        'key': key,
                        'bairro': childData.bairro
                    }
                });
                service.saveProfileData("user.current_user_place", user);
            //    callback(user);
            });

            profissionais = firebase.database().ref('profissionais_idade').orderByChild('profissional_id').equalTo(uid);
            profissionais.once('value').then(function (snapshot) {
                snapshot.forEach(function (childSnapshot) {
                    var key = childSnapshot.key;
                    var childData = childSnapshot.val();
                    user = {
                        'key': key,
                        'idade_min': childData.idade_min,
                        'idade_max': childData.idade_max
                    }
                });
                service.saveProfileData("user.current_user_age", user);
           //     callback(user);
            });

            profissionais = firebase.database().ref('profissionais_valor').orderByChild('profissional_id').equalTo(uid);
            profissionais.once('value').then(function (snapshot) {
                snapshot.forEach(function (childSnapshot) {
                    var key = childSnapshot.key;
                    var childData = childSnapshot.val();
                    user = {
                        'key': key,
                        'valor_min': childData.valor_min,
                        'valor_max': childData.valor_max
                    }
                });
                service.saveProfileData("user.current_user_price", user);
            //    callback(user);
            });

            profissionais = firebase.database().ref('profissionais_treinos').orderByChild('profissional_id').equalTo(uid);
            profissionais.once('value').then(function (snapshot) {
                snapshot.forEach(function (childSnapshot) {
                    var key = childSnapshot.key;
                    var childData = childSnapshot.val();
                    user = {
                        'key': key,
                        'treinos': childData.treinos
                    }
                });
                service.saveProfileData("user.current_user_acts", user);
                callback(user);
            });
        } else {
            var alunos = [];
            alunos = firebase.database().ref('alunos').orderByChild('id').equalTo(uid);
            alunos.once('value').then(function (snapshot) {
                snapshot.forEach(function (childSnapshot) {
                    var key = childSnapshot.key;
                    var childData = childSnapshot.val();
                    user = {
                        'key': key,
                        'picture': childData.imagem,
                        'nome': childData.nome,
                        'sobrenome': childData.sobrenome,
                        'cidade': childData.cidade,
                        'estado': childData.estado,
                        'exibirNotif': childData.exibir_notif,
                        'email': childData.email,
                        'nascimento': childData.nascimento,
                        'sexo': childData.sexo
                    }
                });
                service.saveProfileData("user.current_user_data", user);
                callback(user);
            });
        }
        
    }

    service.getByGeo = function (lat, lng, radius) {

        if (typeof geoQuery !== 'undefined') {
            geoQuery.updateCriteria({
                center: [lat, lng],
                radius: Number(radius)
            });
        } else {
            var geoFire = new GeoFire(database);
            geoQuery = geoFire.query({
                center: [lat, lng],
                radius: Number(radius)
            });
        }
        return geoQuery;
    };

    service.create = function (object) {

        var defer = $q.defer();
        objects.$loaded().then(function () {
            object.g = service.encodeGeohash(object.l);

            defer.resolve(objects.$add(object));
        });
        return defer.promise;
    };

    service.get = function (id) {
        var defer = $q.defer();

        objects.$loaded().then(function () {
            defer.resolve(objects.$getRecord(id));
        });
        return defer.promise;
    };

    service.getEspecialidades = function (modalidade) {
        var defer = $q.defer();

        objects.$loaded().then(function () {
            defer.resolve(objects.$indexFor('modalidade'));
        });
        return defer.promise;
        //return $firebaseArray(root.child('enderecos').orderByChild('modalidades').equalTo(profissional));
    };

    service.encodeGeohash = function (location, precision) {

        // Default geohash length
        var g_GEOHASH_PRECISION = 10;

        // Characters used in location geohashes
        var g_BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

        if (typeof precision !== "undefined") {
            if (typeof precision !== "number" || isNaN(precision)) {
                throw new Error("precision must be a number");
            }
            else if (precision <= 0) {
                throw new Error("precision must be greater than 0");
            }
            else if (precision > 22) {
                throw new Error("precision cannot be greater than 22");
            }
            else if (Math.round(precision) !== precision) {
                throw new Error("precision must be an integer");
            }
        }
        // Use the global precision default if no precision is specified
        precision = precision || g_GEOHASH_PRECISION;

        var latitudeRange = {
            min: -90,
            max: 90
        };
        var longitudeRange = {
            min: -180,
            max: 180
        };
        var hash = "";
        var hashVal = 0;
        var bits = 0;
        var even = 1;

        while (hash.length < precision) {
            var val = even ? location[1] : location[0];
            var range = even ? longitudeRange : latitudeRange;
            var mid = (range.min + range.max) / 2;

            /* jshint -W016 */
            if (val > mid) {
                hashVal = (hashVal << 1) + 1;
                range.min = mid;
            }
            else {
                hashVal = (hashVal << 1) + 0;
                range.max = mid;
            }
            /* jshint +W016 */

            even = !even;
            if (bits < 4) {
                bits++;
            }
            else {
                bits = 0;
                hash += g_BASE32[hashVal];
                hashVal = 0;
            }
        }
        return hash;
    };

    /* service.setUser = function (user_data) {
         window.localStorage.starter_facebook_user = JSON.stringify(user_data);
     };
 
     service.getUser = function () {
         return JSON.parse(window.localStorage.starter_facebook_user || '{}');
     };
 
     return {
         getUser: getUser,
         setUser: setUser
     };*/
});
