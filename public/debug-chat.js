// Copy and paste this into your browser console to debug the chat
// Run this on the community.html page

function debugChatState() {
  console.log('\n========== CHAT DEBUG INFO ==========\n');
  
  // Get Angular scope
  var scope = angular.element(document.querySelector('[ng-controller="ChatController"]')).scope();
  
  if (!scope) {
    console.error('❌ ChatController scope not found!');
    return;
  }
  
  console.log('✅ ChatController scope found');
  
  // Check user authentication
  console.log('\n--- Authentication ---');
  var userId = localStorage.getItem('userId');
  var role = localStorage.getItem('role');
  console.log('UserId from localStorage:', userId);
  console.log('Role from localStorage:', role);
  console.log('UserId in scope:', scope.role);
  
  if (!userId) {
    console.error('❌ No userId found - USER NOT LOGGED IN!');
    console.log('Solution: Login first at login.html');
    return;
  } else {
    console.log('✅ User is logged in');
  }
  
  // Check selected community
  console.log('\n--- Selected Community ---');
  console.log('Selected community:', scope.selectedCommunity);
  if (!scope.selectedCommunity) {
    console.warn('⚠️ No community selected');
    console.log('Solution: Click on a community in the left sidebar');
  } else {
    console.log('✅ Community selected:', scope.selectedCommunity.name);
    console.log('Community ID:', scope.selectedCommunity._id);
    console.log('Community members:', scope.selectedCommunity.members);
  }
  
  // Check membership
  console.log('\n--- Membership Status ---');
  if (scope.selectedCommunity) {
    var isMember = scope.isJoined(scope.selectedCommunity);
    console.log('Is user a member?', isMember);
    console.log('Joined communities tracker:', scope.joinedCommunityIds);
    
    if (!isMember) {
      console.error('❌ USER IS NOT A MEMBER OF THIS COMMUNITY!');
      console.log('Solution: Click the "Join" button next to the community name');
      console.log('Or run: angular.element(document.querySelector("[ng-controller=\\'ChatController\\']")).scope().$apply(function() { scope.joinCommunity(scope.selectedCommunity); });');
    } else {
      console.log('✅ User is a member of this community');
    }
  }
  
  // Check socket connection
  console.log('\n--- Socket.io Connection ---');
  console.log('Has Socket service?', scope.hasSocket);
  console.log('Socket connected?', scope.socketConnected);
  
  if (!scope.hasSocket) {
    console.error('❌ Socket service not available!');
  } else if (!scope.socketConnected) {
    console.warn('⚠️ Socket not connected yet');
    console.log('Check browser console for connection errors');
  } else {
    console.log('✅ Socket connected');
  }
  
  // Check message input
  console.log('\n--- Message Input ---');
  console.log('Current message:', scope.userMessage);
  console.log('Message length:', scope.userMessage ? scope.userMessage.length : 0);
  console.log('Is message empty?', !scope.userMessage || !scope.userMessage.trim());
  
  // Check for errors
  console.log('\n--- Current Errors ---');
  console.log('Send error:', scope.sendError || 'None');
  
  // Messages
  console.log('\n--- Messages ---');
  console.log('Number of messages:', scope.messages ? scope.messages.length : 0);
  
  // Summary
  console.log('\n========== SUMMARY ==========');
  var issues = [];
  
  if (!userId) issues.push('❌ Not logged in');
  if (!scope.selectedCommunity) issues.push('⚠️ No community selected');
  if (scope.selectedCommunity && !scope.isJoined(scope.selectedCommunity)) {
    issues.push('❌ Not a member of selected community');
  }
  if (!scope.socketConnected) issues.push('⚠️ Socket not connected');
  
  if (issues.length === 0) {
    console.log('✅ Everything looks good! You should be able to send messages.');
  } else {
    console.log('Issues found:');
    issues.forEach(function(issue) { console.log(issue); });
  }
  
  console.log('\n=====================================\n');
  
  return {
    userId: userId,
    role: role,
    selectedCommunity: scope.selectedCommunity,
    isMember: scope.selectedCommunity ? scope.isJoined(scope.selectedCommunity) : false,
    socketConnected: scope.socketConnected,
    joinedCommunities: scope.joinedCommunityIds,
    currentMessage: scope.userMessage,
    error: scope.sendError
  };
}

// Auto-run on load
console.log('🔍 Chat Debug Script Loaded');
console.log('Run debugChatState() to see detailed info');
console.log('Or just wait 1 second for auto-check...');

setTimeout(debugChatState, 1000);
