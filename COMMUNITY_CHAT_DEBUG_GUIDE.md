# Community Chat - Testing & Debug Guide

## Changes Made

### 1. **Enhanced Socket.io Service** (`script.js`)
   - Added proper connection event handlers (connect, disconnect, connect_error)
   - Added connection status tracking
   - Added comprehensive console logging for debugging
   - Added reconnection configuration
   - Added `isConnected()` and `onConnection()` methods

### 2. **Improved ChatController** (`script.js`)
   - Added real-time connection status tracking (`$scope.socketConnected`)
   - Added periodic connection check (every 2 seconds)
   - Added automatic room rejoin on reconnection
   - Enhanced message filtering logic with better logging
   - Added duplicate message prevention
   - Added membership validation before sending

### 3. **Better SendMessage Function** (`script.js`)
   - Added comprehensive validation (message, community, user, membership)
   - Added HTTP fallback when socket is not connected
   - Added detailed error messages
   - Added logging at every step

### 4. **Server-Side Logging** (`server.js`)
   - Added connection/disconnection logging
   - Added detailed logging for joinCommunity events
   - Added detailed logging for sendMessage events
   - Added room broadcast confirmation

### 5. **UI Status Indicator** (`community.html`)
   - Visual connection status with colors:
     - 🟢 Green "Connected" - Socket is connected
     - 🟠 Orange "Connecting..." - Socket service exists but not connected
     - 🔴 Red "Offline" - No socket service

---

## How to Test

### Step 1: Restart the Server
```powershell
# Navigate to project directory
cd "C:\HARSHINI\SEM 5\web technology\LAB\book-bliss"

# Stop any running server (Ctrl+C)
# Start fresh
node server.js
```

You should see:
```
MongoDB connected
Server running at http://localhost:3000
```

### Step 2: Open Browser DevTools
1. Open http://localhost:3000/community.html
2. Open Developer Tools (F12)
3. Go to the **Console** tab

### Step 3: Check Connection Status

Look for these console messages in the browser:
```
Initializing Socket.io connection...
Socket.io connected successfully
```

Look at the top-right of the chat header - you should see:
- **● Connected** (green) - Everything is working!
- **● Connecting...** (orange) - Still connecting, wait a moment
- **● Offline** (red) - Socket.io not available, check server

### Step 4: Test Chat Flow

#### A. Join a Community
1. Click on a community in the left sidebar
2. If not already joined, click "Join" button
3. Browser console should show: `Joining community: <communityId>`
4. Server console should show: `Socket <id> joined room: community:<communityId>`

#### B. Send a Message
1. Type a message in the input box
2. Click "Send"
3. **Browser console** should show:
   ```
   Sending message via socket...
   Socket event received: sendMessage <data>
   Socket sendMessage response: {ok: true}
   Received newMessage event: <message object>
   Adding new message to chat
   ```

4. **Server console** should show:
   ```
   === sendMessage received ===
   From socket: <socket-id>
   Payload: {communityId: ..., userId: ..., text: ...}
   Broadcasting message to room: community:<id>
   Message ID: <message-id>
   Sender: <username>
   Message broadcast successful
   ```

### Step 5: Test Multi-User Chat

#### Open Two Browser Windows/Tabs:
1. Window 1: Login as User A
2. Window 2: Login as User B
3. Both join the same community
4. Send a message from User A
5. **The message should appear in BOTH windows instantly!**

---

## Common Issues & Solutions

### Issue 1: "● Offline" or "● Connecting..." Status

**Symptoms:**
- Red or orange status indicator
- Messages don't send
- Console shows: "Socket not connected, using HTTP fallback"

**Solutions:**
1. **Check if server is running:**
   ```powershell
   netstat -an | findstr 3000
   ```
   Should show `LISTENING` on port 3000

2. **Check browser console for errors:**
   - Look for "Socket.io connection error"
   - Check if socket.io.js is loading: http://localhost:3000/socket.io/socket.io.js

3. **Clear browser cache and reload:**
   - Press Ctrl+Shift+R (hard reload)

4. **Check CORS settings:**
   - Server.js has `cors: { origin: '*' }` - should allow all origins

### Issue 2: Messages Not Appearing for Other Users

**Symptoms:**
- Message sends successfully
- Other users in same community don't see it
- Server shows "Message broadcast successful"

**Solutions:**
1. **Check if both users joined the room:**
   - Server console should show: `Socket <id> joined room: community:<id>` for both users

2. **Check community IDs match:**
   - Browser console: Compare `msgCommunityId` and `selectedCommunityId` in logs

3. **Refresh both browser windows:**
   - Messages might be queued, refresh to sync

### Issue 3: Duplicate Messages

**Symptoms:**
- Same message appears multiple times

**Solutions:**
- This is now prevented by duplicate checking logic
- If still occurring, check server logs for multiple broadcast calls

### Issue 4: "Join the community to send messages" Error

**Symptoms:**
- Cannot send messages even though joined

**Solutions:**
1. **Verify membership in database:**
   ```javascript
   // In MongoDB shell or Compass
   db.users.findOne({_id: <userId>}, {joinedCommunities: 1})
   db.communities.findOne({_id: <communityId>}, {members: 1})
   ```

2. **Try rejoining:**
   - Click "Join" button again
   - Check server logs for join confirmation

3. **Check userId in localStorage:**
   - Browser console: `localStorage.getItem('userId')`
   - Should return a valid MongoDB ObjectId

### Issue 5: HTTP Fallback Being Used

**Symptoms:**
- Console shows: "Socket not connected, using HTTP fallback"
- Messages work but with delay

**Solutions:**
- This is actually a **good fallback** if socket fails
- To fix socket connection, see Issue 1 above
- Messages will still work via HTTP POST

---

## Debug Checklist

Before reporting an issue, verify:

- [ ] Server is running on port 3000
- [ ] MongoDB is connected (server console shows "MongoDB connected")
- [ ] User is logged in (localStorage has userId)
- [ ] User has joined the community
- [ ] Browser console is open to see logs
- [ ] Server console is visible to see server-side logs
- [ ] Connection status shows "● Connected" (green)
- [ ] No JavaScript errors in browser console

---

## Advanced Debugging

### Enable Verbose Socket.io Logging (Server)

Add to server.js before `io.on('connection')`:
```javascript
io.engine.on("connection_error", (err) => {
  console.log('Engine connection error:', err);
});
```

### Monitor Socket Events (Browser)

Add to ChatController in script.js:
```javascript
if (Socket) {
  ['connect', 'disconnect', 'error', 'reconnect', 'reconnect_attempt'].forEach(function(event) {
    Socket.on(event, function() {
      console.log('Socket event:', event, arguments);
    });
  });
}
```

### Check Network Tab

1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Look for socket.io connection
4. Should see: Status 101 (Switching Protocols)

---

## Success Criteria

✅ Connection status shows "● Connected" (green)
✅ Console logs show successful socket initialization
✅ Joining a community logs to server console
✅ Sending a message logs to both browser and server console
✅ Message appears in sender's chat immediately
✅ Message appears in other users' chats in real-time (< 1 second)
✅ No JavaScript errors in console
✅ No duplicate messages

---

## Need More Help?

If chat still doesn't work after following this guide:

1. **Copy the relevant console logs:**
   - Browser console (from opening page to sending message)
   - Server console (from starting server to handling message)

2. **Check these specific points:**
   - Is the userId valid in localStorage?
   - Is the user actually a member of the community? (check database)
   - Are both users in the same community?
   - Is the socket ID the same or different for each user?

3. **Test the HTTP fallback:**
   - The system should work even without sockets using HTTP POST
   - If HTTP works but sockets don't, it's a socket.io configuration issue
