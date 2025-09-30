angular.module("bookApp", [])
  // Local auth context based on localStorage set by login flow
  .service('AuthContext', function() {
    return {
      getUserId: function() { return localStorage.getItem('userId'); },
      getRole: function() { return localStorage.getItem('role') || 'user'; }
    };
  })
  .service('UserApi', function($http) {
    this.getUser = function(id) { return $http.get('/api/users/' + id).then(function(r){ return r.data; }); };
    this.updateUser = function(id, profile) { return $http.put('/api/users/' + id, { profile: profile }).then(function(r){ return r.data.user; }); };
  })
  .service('CommunityApi', function($http) {
    this.list = function() { return $http.get('/api/community').then(function(r){ return r.data; }); };
    this.join = function(communityId, userId) { return $http.post('/api/community/' + communityId + '/join', { userId: userId }).then(function(r){ return r.data; }); };
    this.getMessages = function(communityId, since) {
      var url = since ? '/api/community/' + communityId + '/messages?since=' + encodeURIComponent(since) : '/api/community/' + communityId + '/messages';
      return $http.get(url).then(function(r){ return r.data; });
    };
    // HTTP send kept as a fallback; socket path is used in controller
    this.sendMessage = function(communityId, userId, text) {
      return $http.post('/api/community/' + communityId + '/messages', { userId: userId, text: text }).then(function(r){ return r.data; });
    };
  })
  .service('Socket', function($rootScope) {
    var socket = null;
    function ensure() { if (!socket) { socket = io(); } return socket; }
    return {
      joinCommunity: function(communityId) {
        ensure().emit('joinCommunity', { communityId: communityId });
      },
      on: function(event, handler) {
        ensure().on(event, function() {
          var args = arguments;
          $rootScope.$applyAsync(function() { handler.apply(null, args); });
        });
      },
      sendMessage: function(payload, ack) {
        ensure().emit('sendMessage', payload, function(res) {
          $rootScope.$applyAsync(function(){ if (ack) ack(res); });
        });
      }
    };
  })

  // Profile page controller
  .controller('ProfileController', function($scope, AuthContext, UserApi) {
    $scope.loading = true;
    $scope.saving = false;
    $scope.profile = { displayName: '', email: '', avatarUrl: '', bio: '', favoriteGenres: [], preferredFormats: [], location: '' };
    $scope.user = null;

    var userId = AuthContext.getUserId();
    if (!userId) {
      $scope.error = 'Please log in to view your profile.';
      $scope.loading = false;
      return;
    }

    function toCsv(arr) { return Array.isArray(arr) ? arr.join(', ') : ''; }
    function fromCsv(s) { return (s || '').split(',').map(function(x){ return x.trim(); }).filter(Boolean); }

    UserApi.getUser(userId).then(function(u){
      $scope.user = u;
      var p = u && u.profile ? u.profile : {};
      $scope.profile = Object.assign({}, {
        displayName: p.displayName || '',
        email: p.email || '',
        avatarUrl: p.avatarUrl || '',
        bio: p.bio || '',
        favoriteGenresCsv: toCsv(p.favoriteGenres || []),
        preferredFormatsCsv: toCsv(p.preferredFormats || []),
        location: p.location || ''
      });
    }).finally(function(){ $scope.loading = false; });

    $scope.save = function() {
      $scope.saving = true;
      var payload = {
        displayName: $scope.profile.displayName,
        email: $scope.profile.email,
        avatarUrl: $scope.profile.avatarUrl,
        bio: $scope.profile.bio,
        favoriteGenres: fromCsv($scope.profile.favoriteGenresCsv),
        preferredFormats: fromCsv($scope.profile.preferredFormatsCsv),
        location: $scope.profile.location
      };
      UserApi.updateUser(userId, payload)
        .then(function(u){ $scope.user = u; $scope.success = 'Profile saved'; })
        .catch(function(){ $scope.error = 'Failed to save profile'; })
        .finally(function(){ $scope.saving = false; });
    };
  })

  // Community chat controller (fetches communities, supports join, and chat)
  .controller("ChatController", function ($scope, $timeout, $interval, CommunityApi, AuthContext, $injector) {
    $scope.communities = [];
    $scope.boot = 'starting';
    var Socket = null; try { Socket = $injector.get('Socket'); } catch (e) { Socket = null; }
    $scope.hasSocket = !!Socket;
    $scope.searchText = "";
    $scope.selectedCommunity = null; // object {_id, name}
    $scope.selectedDate = null;
    $scope.userMessage = "";
    $scope.messages = [];
    $scope.joinedCommunityIds = {};
    $scope.role = AuthContext.getRole();
    var userId = AuthContext.getUserId();

    function loadCommunities() {
      CommunityApi.list().then(function(list){
        $scope.communities = list;
      });
    }

    function refreshJoinedFromUser() {
      // optional: could fetch user for real membership; for now, track on select/join handlers.
    }

    $scope.getFilteredCommunities = function () {
      var items = $scope.communities || [];
      if (!$scope.searchText) return items;
      return items.filter(function(c){ return (c.name || '').toLowerCase().indexOf($scope.searchText.toLowerCase()) !== -1; });
    };

    $scope.selectCommunity = function (community) {
      $scope.selectedCommunity = community;
      $scope.selectedDate = null;
      $scope.messages = [];
      fetchMessages();
      // join socket room for real-time updates
      if (Socket && community && community._id) { Socket.joinCommunity(community._id); }
    };

    function fetchMessages() {
      if (!$scope.selectedCommunity) return;
      CommunityApi.getMessages($scope.selectedCommunity._id).then(function(msgs){
        $scope.messages = msgs;
        scrollToBottom();
      });
    }

    function scrollToBottom() {
      $timeout(function(){
        var chatBox = document.getElementById("chatBox");
        if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
      }, 100);
    }

    // Real-time incoming messages via socket
    if (Socket) Socket.on('newMessage', function(msg){
      if ($scope.selectedCommunity && String(msg.community) !== String($scope.selectedCommunity._id)) return; // ignore different rooms if any
      $scope.messages = ($scope.messages || []).concat([msg]);
      scrollToBottom();
    });

    $scope.isJoined = function(community) {
      // In a robust app, fetch membership from user record; here we infer by presence in members or tracked set.
      if (community && Array.isArray(community.members) && userId) {
        if (community.members.some(function(m){ return String(m) === String(userId); })) return true;
      }
      return !!$scope.joinedCommunityIds[String(community && community._id)];
    };

    $scope.joinCommunity = function(community) {
      if ($scope.role === 'admin') { alert('Admins cannot join communities.'); return; }
      if (!userId) { alert('Please log in first.'); return; }
      CommunityApi.join(community._id, userId).then(function(){
        $scope.joinedCommunityIds[String(community._id)] = true;
        // reflect membership locally
        community.members = community.members || [];
        community.members.push(userId);
      }).catch(function(){ alert('Failed to join community'); });
    };

    $scope.sendMessage = function () {
      $scope.sendError = '';
      if (!$scope.userMessage || !$scope.userMessage.trim() || !$scope.selectedCommunity) return;
      if (!userId) { $scope.sendError = 'Please log in first.'; return; }
      // Prefer socket send for instant delivery
      if (!Socket) { $scope.sendError = 'Realtime disabled'; return; }
      Socket.sendMessage({ communityId: $scope.selectedCommunity._id, userId: userId, text: $scope.userMessage }, function(res){
        if (res && res.error) { $scope.sendError = res.error; return; }
        $scope.userMessage = "";
        // no need to refetch; 'newMessage' event will append
      });
    };

    $scope.messageIsMine = function(msg) {
      return userId && msg.sender && (String(msg.sender._id || msg.sender) === String(userId));
    };

    // Initialize
    loadCommunities();
    refreshJoinedFromUser();
  });
