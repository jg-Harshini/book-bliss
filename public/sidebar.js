// Standardized Sidebar Component for BookBliss
function createSidebar(currentPage = '') {
  const pages = {
    'index.html': { name: 'Home', icon: '🏠' },
    'browse.html': { name: 'Browse', icon: '🔍' },
    'community.html': { name: 'Community', icon: '👥' },
    'admin.html': { name: 'Admin', icon: '⚙️' },
    'author.html': { name: 'Authors', icon: '✍️' },
    'about.html': { name: 'About', icon: 'ℹ️' },
    'chatbot.html': { name: 'AI Chat', icon: '🤖' }
  };

  function navigateToPage(page) {
    window.location.href = page;
  }

  // Return HTML structure
  return `
    <div class="sidebar">
      <div class="logo">📖<span>BookBliss</span></div>
      ${Object.entries(pages).map(([page, info]) => `
        <button onclick="window.location.href='${page}'" ${currentPage === page ? 'class="active"' : ''}>
          ${info.icon} ${info.name}
        </button>
      `).join('')}
    </div>
  `;
}

// CSS for standardized sidebar
const sidebarCSS = `
  .sidebar {
    width: 180px;
    background-color: #9b5de5;
    padding-top: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    position: fixed;
    height: 100vh;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  }

  .sidebar .logo {
    font-size: 1.5rem;
    color: white;
    text-align: center;
    margin-bottom: 20px;
    font-weight: bold;
  }

  .sidebar .logo span {
    margin-left: 8px;
  }

  .sidebar button {
    background: none;
    border: none;
    cursor: pointer;
    color: white;
    font-size: 16px;
    text-align: center;
    white-space: nowrap;
    width: 100%;
    padding: 12px 0;
    transition: background-color 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .sidebar button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .sidebar button.active {
    background-color: rgba(255, 255, 255, 0.2);
    font-weight: bold;
  }

  .main {
    margin-left: 180px;
    padding: 40px 25px;
    width: calc(100% - 180px);
  }
`;

// For AngularJS pages
function setupAngularSidebar(scope) {
  scope.navigateToPage = function(page) {
    window.location.href = page;
  };
}