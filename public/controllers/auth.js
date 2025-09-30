angular.module('myApp').controller('AuthCtrl', ['$scope', '$http', function($scope, $http) {
  $scope.username = '';
  $scope.password = '';
  $scope.message = '';

  // Register
  $scope.register = function() {
    $http.post('/api/auth/register', {
      username: $scope.username,
      password: $scope.password
    }).then(function(response) {
      $scope.message = response.data.message;
    }, function(error) {
      $scope.message = error.data.message;
    });
  };

  // Login
  $scope.login = function() {
    $http.post('/api/auth/login', {
      username: $scope.username,
      password: $scope.password
    }).then(function(response) {
      $scope.message = response.data.message;
      localStorage.setItem('userId', response.data.userId);
      if (response.data.role) localStorage.setItem('role', response.data.role);
    }, function(error) {
      $scope.message = error.data.message;
    });
  };
}]);
