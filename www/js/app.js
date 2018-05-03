// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
//angular.module('starter', ['ionic', 'starter.controllers', 'starter.services'])

App.run(function($ionicPlatform,$state,$rootScope,$firebaseAuth,$ionicLoading, $location) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    var config = {
      apiKey: "AIzaSyBX49lvY0NdOfvK8gB-2U9wmYqi6NxFL1Y",
      authDomain: "learnfirebase-b42c0.firebaseapp.com",
      databaseURL: "https://learnfirebase-b42c0.firebaseio.com",
      projectId: "learnfirebase-b42c0",
      storageBucket: "",
      messagingSenderId: "129383281024"
    };
    firebase.initializeApp(config);

    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider,$ionicConfigProvider) {

  $ionicConfigProvider.tabs.position('bottom');

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html',
    controller: 'TabCtrl'
  })

  .state('menu', {
      url : '/menu',
      templateUrl : 'templates/menu.html',
      abstract : true,
  })


  .state('intro', {
      url: '/intro',
      templateUrl: 'templates/intro.html'
  })

  .state('login', {
      url: '/login',
      controller: 'LoginCtrl',
      templateUrl: 'templates/login.html'
    })

  .state('register', {
    url: '/register',
    controller: 'RegisterCtrl',
    templateUrl: 'templates/register.html'
  })

  // Each tab has its own nav history stack:

  .state('tab.dash', {
    url: '/dash',
    views: {
      'tab-dash': {
        // templateUrl: 'templates/tab-dash.html',
        templateUrl: 'templates/tab-home.html',
        controller: 'DashCtrl'
      }
    }
  })


  .state('configuration', {
    url: '/configuration',
    templateUrl: 'templates/configuration.html',
    controller: 'ConfigurationCtrl',
  })


  .state('tab.dash-detail', {
    url: '/dash/:dashId',
    views: {
      'tab-dash': {
        templateUrl: 'templates/dash-detail.html',
        controller: 'DashDetailCtrl'
      }
    }
  })

  .state('tab.chats', {
      url: '/chats',
      views: {
        'tab-chats': {
          templateUrl: 'templates/tab-chats.html',
          controller: 'ChatsCtrl'
        }
      }
    })
    .state('tab.chat-detail', {
      url: '/chats/:chatId',
      views: {
        'tab-chats': {
          templateUrl: 'templates/chat-detail.html',
          controller: 'ChatDetailCtrl'
        }
      }
    })

  .state('tab.account-detail', {
      url: '/account/:accountId',
      views: {
        'tab-account': {
          templateUrl: 'templates/account-detail.html',
          controller: 'AccountDetailCtrl'
        }
      }
    })

  .state('tab.form', {
      url: '/form',
      views: {
        'tab-form': {
          templateUrl: 'templates/tab-form.html',
          controller: 'FormCtrl'
        }
      }
    })

  // .state('tab.preform', {
  //     url: '/preform',
  //     views: {
  //       'tab-preform': {
  //         templateUrl: 'templates/tab-preform.html',
  //         controller: 'FormPreCtrl'
  //       }
  //     }
  // })


  .state('tab.account', {
    url: '/account',
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html',
        controller: 'AccountCtrl',
        reload: true
      }
    },
    cache: false,
    reload: true
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('intro');

});
