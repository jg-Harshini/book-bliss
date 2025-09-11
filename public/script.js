angular.module("bookApp", [])
  .service("ChatService", function () {
    const allMessages = {
      "RealmWeavers": [
        {
          sender: "Emily",
          text: "Welcome to RealmWeavers! Magic begins here.",
          time: new Date("2025-08-03T10:00:00")
        }
      ],
      "The Clue Circle": [
        {
          sender: "Detective",
          text: "Let’s crack the case together!",
          time: new Date("2025-08-04T09:30:00")
        }
      ],
      "PageQuest": [
        {
          sender: "Emily",
          text: "Just wrapped up Land of Lost Brothers!",
          time: new Date("2025-08-03T10:00:00")
        },
        {
          sender: "User",
          text: "Sounds amazing! Adding it to my list!",
          time: new Date("2025-08-04T12:00:00")
        }
      ]
    };

    return {
      getMessages: (communityName) => allMessages[communityName] || [],
      addMessage: (communityName, text) => {
        if (!allMessages[communityName]) {
          allMessages[communityName] = [];
        }
        allMessages[communityName].push({
          sender: "User",
          text: text,
          time: new Date()
        });
      }
    };
  })

  .controller("ChatController", function ($scope, ChatService, $timeout) {
    $scope.communities = [
      "RealmWeavers",
      "The Clue Circle",
      "Heartbound Haven",
      "NovaMinds",
      "TimeTurners Guild",
      "ShadowShelf",
      "YouthQuill",
      "PageQuest"
    ];

    $scope.searchText = "";
    $scope.selectedCommunity = null;
    $scope.selectedDate = null;
    $scope.userMessage = "";
    $scope.allMessages = [];
    $scope.filteredMessages = [];

    $scope.getFilteredCommunities = function () {
      if (!$scope.searchText) return $scope.communities;
      return $scope.communities.filter(name =>
        name.toLowerCase().includes($scope.searchText.toLowerCase())
      );
    };

    $scope.selectCommunity = function (communityName) {
      $scope.selectedCommunity = communityName;
      $scope.selectedDate = null;
      $scope.allMessages = ChatService.getMessages(communityName);
      $scope.filterMessages();
    };

    $scope.filterMessages = function () {
      if (!$scope.selectedDate) {
        $scope.filteredMessages = $scope.allMessages || [];
        return;
      }

      const selected = new Date($scope.selectedDate);
      $scope.filteredMessages = ($scope.allMessages || []).filter(msg => {
        const msgDate = new Date(msg.time);
        return msgDate.toDateString() === selected.toDateString();
      });
    };

    $scope.sendMessage = function () {
      if ($scope.userMessage.trim() !== "" && $scope.selectedCommunity) {
        ChatService.addMessage($scope.selectedCommunity, $scope.userMessage);
        $scope.userMessage = "";
        $scope.allMessages = ChatService.getMessages($scope.selectedCommunity);
        $scope.filterMessages();

        // Auto-scroll to bottom
        $timeout(() => {
          const chatBox = document.getElementById("chatBox");
          if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
        }, 100);
      }
    };
  });
