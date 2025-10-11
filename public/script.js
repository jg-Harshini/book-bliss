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
    var connected = false;
    var connectionCallbacks = [];
    
    function ensure() { 
      if (!socket) { 
        console.log('Initializing Socket.io connection...');
        socket = io({
          transports: ['websocket', 'polling'],
          timeout: 20000,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5
        });
        
        socket.on('connect', function() {
          console.log('Socket.io connected successfully');
          connected = true;
          connectionCallbacks.forEach(function(cb) { cb(true); });
          connectionCallbacks = [];
        });
        
        socket.on('disconnect', function() {
          console.log('Socket.io disconnected');
          connected = false;
        });
        
        socket.on('connect_error', function(err) {
          console.error('Socket.io connection error:', err);
          connected = false;
          connectionCallbacks.forEach(function(cb) { cb(false); });
          connectionCallbacks = [];
        });
      } 
      return socket; 
    }
    
    return {
      isConnected: function() { return connected; },
      onConnection: function(callback) {
        if (connected) {
          callback(true);
        } else {
          connectionCallbacks.push(callback);
          ensure(); // Trigger connection if not already done
        }
      },
      joinCommunity: function(communityId) {
        console.log('Joining community:', communityId);
        ensure().emit('joinCommunity', { communityId: communityId });
      },
      on: function(event, handler) {
        ensure().on(event, function() {
          var args = arguments;
          console.log('Socket event received:', event, args);
          $rootScope.$applyAsync(function() { handler.apply(null, args); });
        });
      },
      sendMessage: function(payload, ack) {
        console.log('Sending message via socket:', payload);
        ensure().emit('sendMessage', payload, function(res) {
          console.log('Socket sendMessage response:', res);
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
  .controller("ChatController", function ($scope, $timeout, $interval, CommunityApi, UserApi, AuthContext, $injector) {
    $scope.communities = [];
    $scope.boot = 'starting';
    var Socket = null; try { Socket = $injector.get('Socket'); } catch (e) { console.error('Socket service not available:', e); Socket = null; }
    $scope.hasSocket = false;
    $scope.socketConnected = false;
    $scope.searchText = "";
    $scope.selectedCommunity = null; // object {_id, name}
    $scope.selectedDate = null;
    $scope.userMessage = "";
    $scope.messages = [];
    $scope.joinedCommunityIds = {};
    $scope.sendError = '';
    $scope.role = AuthContext.getRole();
    var userId = AuthContext.getUserId();
    $scope.userId = userId; // Expose to template
    
    // Initialize socket connection and track status
    if (Socket) {
      $scope.hasSocket = true;
      Socket.onConnection(function(status) {
        $scope.socketConnected = status;
        console.log('Socket connection status updated:', status);
        if (!status) {
          $scope.sendError = 'Realtime connection lost';
        } else {
          $scope.sendError = '';
          // Rejoin current community room if connected
          if ($scope.selectedCommunity && $scope.selectedCommunity._id) {
            Socket.joinCommunity($scope.selectedCommunity._id);
          }
        }
      });
      // Check connection status periodically
      $interval(function() {
        $scope.socketConnected = Socket.isConnected();
      }, 2000);
    }

    function loadCommunities() {
      CommunityApi.list().then(function(list){
        $scope.communities = list;
        console.log('✅ Communities loaded:', list.length);
        list.forEach(function(c) {
          console.log('  - ' + c.name + ' (members: ' + (c.members ? c.members.length : 0) + ')');
        });
      });
    }

    function refreshJoinedFromUser() {
      // Fetch user data to get actual joined communities from database
      if (!userId) {
        console.log('⚠️ No userId - skipping user data fetch');
        return;
      }
      
      console.log('🔍 Fetching user data for userId:', userId);
      UserApi.getUser(userId)
        .then(function(user) {
          console.log('✅ User data fetched:', user);
          if (user && user.joinedCommunities) {
            // Populate joinedCommunityIds from user data
            user.joinedCommunities.forEach(function(communityId) {
              $scope.joinedCommunityIds[String(communityId)] = true;
            });
            console.log('✅ Joined communities loaded from user:', Object.keys($scope.joinedCommunityIds));
          } else {
            console.log('⚠️ User has no joinedCommunities array');
          }
        })
        .catch(function(err) {
          console.error('❌ Failed to fetch user data:', err);
        });
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
    if (Socket) {
      Socket.on('newMessage', function(msg){
        console.log('Received newMessage event:', msg);
        // Only add messages for the currently selected community
        if (!$scope.selectedCommunity) {
          console.log('No community selected, ignoring message');
          return;
        }
        var msgCommunityId = String(msg.community._id || msg.community);
        var selectedCommunityId = String($scope.selectedCommunity._id);
        console.log('Comparing community IDs - message:', msgCommunityId, 'selected:', selectedCommunityId);
        if (msgCommunityId !== selectedCommunityId) {
          console.log('Message not for current community, ignoring');
          return;
        }
        // Check if message already exists (to prevent duplicates)
        var exists = $scope.messages.some(function(m) { 
          return String(m._id) === String(msg._id); 
        });
        if (!exists) {
          console.log('Adding new message to chat');
          $scope.messages.push(msg);
          scrollToBottom();
        } else {
          console.log('Message already exists, skipping');
        }
      });
    }

    $scope.isJoined = function(community) {
      if (!community || !userId) return false;
      
      var communityId = String(community._id);
      
      // Check in joinedCommunityIds tracker (primary source of truth)
      if ($scope.joinedCommunityIds[communityId]) {
        return true;
      }
      
      // Check in community.members array (fallback)
      if (community && Array.isArray(community.members) && userId) {
        var isMember = community.members.some(function(m){ 
          return String(m._id || m) === String(userId); 
        });
        if (isMember) {
          // Cache this result to avoid repeated checks
          $scope.joinedCommunityIds[communityId] = true;
          return true;
        }
      }
      
      return false;
    };

    $scope.joinCommunity = function(community) {
      console.log('=== joinCommunity called ===');
      console.log('Community:', community.name, community._id);
      console.log('Role:', $scope.role);
      console.log('UserId:', userId);
      
      if ($scope.role === 'admin') { 
        alert('Admins cannot join communities.'); 
        return; 
      }
      if (!userId) { 
        alert('Please log in first.'); 
        return; 
      }
      
      // Check if already joined
      if ($scope.isJoined(community)) {
        console.log('Already a member');
        return;
      }
      
      CommunityApi.join(community._id, userId)
        .then(function(response){
          console.log('Join API response:', response);
          var communityId = String(community._id);
          $scope.joinedCommunityIds[communityId] = true;
          
          // Reflect membership locally
          community.members = community.members || [];
          // Add userId if not already in array
          var exists = community.members.some(function(m) { 
            return String(m._id || m) === String(userId); 
          });
          if (!exists) {
            community.members.push(userId);
          }
          
          console.log('Successfully joined community:', community.name);
          console.log('Updated members:', community.members);
        })
        .catch(function(err){ 
          console.error('Failed to join community:', err);
          alert('Failed to join community'); 
        });
    };

    $scope.sendMessage = function () {
      console.log('=== sendMessage called ===');
      
      // Fallback: if ng-model fails, get value directly from DOM
      if (!$scope.userMessage) {
        var inputEl = document.getElementById('messageInput');
        if (inputEl && inputEl.value) {
          $scope.userMessage = inputEl.value;
          console.log('Retrieved message from DOM input:', $scope.userMessage);
        }
      }
      
      console.log('userMessage:', $scope.userMessage);
      console.log('selectedCommunity:', $scope.selectedCommunity);
      console.log('userId:', userId);
      console.log('isJoined:', $scope.isJoined($scope.selectedCommunity));
      
      $scope.sendError = '';
      
      if (!userId) { 
        $scope.sendError = 'Please log in first.'; 
        console.log('Error: No userId');
        return; 
      }
      
      if (!$scope.selectedCommunity) {
        $scope.sendError = 'Please select a community first';
        console.log('Error: No community selected');
        return;
      }
      
      if (!$scope.userMessage || !$scope.userMessage.trim()) {
        $scope.sendError = 'Please enter a message';
        console.log('Error: Empty message');
        return;
      }
      
      // Check if user is a member of the community (relaxed check)
      var isMember = $scope.isJoined($scope.selectedCommunity);
      console.log('Membership check result:', isMember);
      
      // Allow sending anyway - server will validate membership
      if (!isMember && $scope.role !== 'admin') {
        console.warn('User might not be a member, but trying to send anyway (server will validate)');
        // Don't return - let the message send and let server validate
      }
      
      var messageText = $scope.userMessage.trim();
      
      // Prefer socket send for instant delivery
      if (!Socket || !$scope.socketConnected) {
        $scope.sendError = 'Realtime connection not available, using fallback...';
        console.log('Socket not connected, using HTTP fallback');
        // Fallback to HTTP POST
        CommunityApi.sendMessage($scope.selectedCommunity._id, userId, messageText)
          .then(function(msg) {
            console.log('Message sent via HTTP:', msg);
            $scope.userMessage = '';
            // Also clear DOM input
            var inputEl = document.getElementById('messageInput');
            if (inputEl) inputEl.value = '';
            $scope.sendError = '';
            // Manually add to messages if not already there
            var exists = $scope.messages.some(function(m) { return String(m._id) === String(msg._id); });
            if (!exists) {
              $scope.messages.push(msg);
              scrollToBottom();
            }
          })
          .catch(function(err) {
            console.error('HTTP send failed:', err);
            $scope.sendError = 'Failed to send message';
          });
        return;
      }
      
      console.log('Sending message via socket...');
      Socket.sendMessage({ 
        communityId: $scope.selectedCommunity._id, 
        userId: userId, 
        text: messageText 
      }, function(res){
        console.log('Socket send callback:', res);
        if (res && res.error) { 
          $scope.sendError = res.error; 
          return; 
        }
        $scope.userMessage = '';
        // Also clear DOM input
        var inputEl = document.getElementById('messageInput');
        if (inputEl) inputEl.value = '';
        $scope.sendError = '';
        // The 'newMessage' event will append the message to the UI
      });
    };

    $scope.messageIsMine = function(msg) {
      return userId && msg.sender && (String(msg.sender._id || msg.sender) === String(userId));
    };

    // Community details modal
    $scope.showCommunityDetails = false;
    
    $scope.toggleCommunityDetails = function() {
      if (!$scope.selectedCommunity) return;
      $scope.showCommunityDetails = !$scope.showCommunityDetails;
      console.log('Toggle community details:', $scope.showCommunityDetails);
    };
    
    $scope.closeCommunityDetails = function() {
      $scope.showCommunityDetails = false;
    };

    // Initialize
    loadCommunities();
    refreshJoinedFromUser();
  });
