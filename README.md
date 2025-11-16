# BookmarkDock

A modern, elegant Chrome extension for managing bookmarks with an intuitive tree-based interface and powerful search capabilities.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/chrome-manifest%20v3-yellow.svg)

## ✨ Features

### 🎯 Quick Access Mini Panel
- **Compact Popup**: 300px clean interface accessible from browser toolbar
- **Dual View Modes**: 
  - **Saved Tab**: Quick list view of all bookmarks
  - **Bookmarks Tab**: Hierarchical tree structure with expandable folders
- **Instant Search**: Real-time search with highlighted results
- **Click to Expand**: Folders only show bookmarks when clicked

### 📊 Full Bookmark Manager
- **Professional Layout**: Clean, spacious full-page interface
- **Complete Tree Structure**: Full bookmark hierarchy with proper indentation
- **Advanced Search**: Search across bookmark titles, URLs, and domains
- **Smart Statistics**: Real-time counts of bookmarks, folders, and visible items
- **Keyboard Shortcuts**: 
  - `Ctrl/Cmd + F`: Focus search
  - `Esc`: Clear search and close

### 🎨 Modern UI/UX
- **Beautiful Design**: Clean, professional interface with modern aesthetics
- **Dark Mode Support**: Automatic detection of system preferences
- **Smooth Animations**: Subtle transitions and hover effects
- **Responsive Layout**: Optimized for different screen sizes
- **Visual Feedback**: Clear hover states and active indicators

### ⚡ Performance
- **Fast Loading**: Optimized bookmark retrieval and rendering
- **Efficient Search**: Debounced input with performance optimizations
- **Memory Efficient**: Clean event handler management
- **Real-time Sync**: Automatic updates when bookmarks change

## 🚀 Installation

### From Source

1. **Clone or Download** the extension:
   ```bash
   git clone https://github.com/yourusername/bookmarkdock.git
   ```
   Or download and extract the ZIP file.

2. **Open Chrome Extensions**:
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right corner)

3. **Load Extension**:
   - Click **Load unpacked**
   - Select the `bookmarkdock` folder

4. **Pin Extension** (Optional):
   - Click the puzzle icon in Chrome toolbar
   - Find "BookmarkDock"
   - Click the pin icon to keep it visible

## 📖 Usage

### Mini Panel

**Access**: Click the extension icon in your Chrome toolbar

#### Saved Tab
- View all bookmarks in a clean list format
- Shows bookmark titles and domains
- Click any bookmark to open in new tab

#### Bookmarks Tab
- Browse bookmarks organized in folder structure
- Click folders to expand/collapse
- See bookmark counts for each folder
- Navigate through nested folders

#### Search
- Type in search box for instant results
- Searches bookmark titles, URLs, and domains
- Highlights matching text
- Clear button appears when searching

### Full Manager

**Access**: Click "Open Full Manager" button in mini panel

#### Features
- **Tree Navigation**: Complete folder hierarchy with visual indentation
- **Expandable Folders**: Click folders to show/hide contents
- **Search Bar**: Search across all bookmarks and folders
- **Statistics Bar**: Shows total bookmarks, folders, and current results
- **Bulk Operations**: Easy browsing of large bookmark collections

#### Tips
- Use `Ctrl/Cmd + F` to quickly focus the search box
- Click folder arrows to expand/collapse
- Search results show all matching items regardless of folder
- Press `Esc` to clear search

## 🛠️ Technical Details

### Architecture

```
bookmarkdock/
├── manifest.json          # Extension configuration (Manifest V3)
├── background.js          # Service worker for bookmark management
├── mini-panel.html        # Popup interface HTML
├── mini-panel.js          # Popup interface logic
├── manager.html           # Full manager HTML
├── manager.js             # Full manager logic
├── icons/                 # Extension icons (16, 48, 128)
└── README.md             # Documentation
```

### Technologies Used

- **Manifest V3**: Latest Chrome extension standard
- **Chrome Bookmarks API**: Native bookmark management
- **Vanilla JavaScript**: No dependencies, pure ES6+
- **CSS3**: Modern styling with flexbox and grid
- **Service Workers**: Background processing and message handling

### Key Components

#### Background Service Worker
- Handles bookmark synchronization
- Manages extension lifecycle
- Processes inter-component messaging

#### Mini Panel
- Lightweight popup interface (300px × 450px)
- Two-tab system for different view modes
- Debounced search with 250ms delay
- Event-driven tree navigation

#### Full Manager
- Comprehensive bookmark management interface
- Responsive layout with max-width 1200px
- Advanced search with result limiting (200 items)
- Statistics tracking and display

## 🔧 Development

### Prerequisites
- Google Chrome (latest version)
- Basic understanding of Chrome Extensions
- Text editor or IDE

### Setup Development Environment

1. **Clone Repository**:
   ```bash
   git clone https://github.com/yourusername/bookmarkdock.git
   cd bookmarkdock
   ```

2. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the project folder

3. **Make Changes**:
   - Edit files in your preferred editor
   - Changes to content scripts require page reload
   - Changes to popup require closing/reopening
   - Changes to background require extension reload

4. **Debug**:
   - **Popup**: Right-click extension icon → Inspect popup
   - **Manager**: Standard Chrome DevTools (F12)
   - **Background**: Extensions page → Inspect service worker
   - **Console Logs**: All components have detailed logging

### File Descriptions

#### `manifest.json`
Extension configuration including permissions, icons, and entry points.

#### `background.js`
Service worker handling:
- Bookmark tree retrieval
- Message passing between components
- Manager page opening logic

#### `mini-panel.html/js`
Popup interface featuring:
- Dual-tab interface
- Tree-based folder navigation
- Real-time search
- Click-to-expand folders

#### `manager.html/js`
Full-page manager with:
- Complete bookmark hierarchy
- Advanced search capabilities
- Statistics dashboard
- Enhanced tree visualization

## 🎨 Customization

### Changing Colors

Edit the CSS in `mini-panel.html` or `manager.html`:

```css
/* Primary color (violet) */
--primary: #7c3aed;
--primary-hover: #6d28d9;

/* Dark mode background */
--dark-bg: #1f2937;
--dark-border: #374151;
```

### Modifying Panel Size

In `mini-panel.html`:

```css
body {
    width: 300px;        /* Change width */
    max-height: 450px;   /* Change height */
}
```

### Adjusting Search Delay

In `mini-panel.js` or `manager.js`:

```javascript
searchTimeout = setTimeout(() => {
    searchQuery = e.target.value.trim().toLowerCase();
    render();
}, 250);  // Change delay in milliseconds
```

## 🐛 Troubleshooting

### Bookmarks Not Showing

**Issue**: Empty state in mini panel or manager

**Solutions**:
1. Check if you have bookmarks in Chrome
2. Reload the extension: `chrome://extensions/` → Click reload
3. Check browser console for errors
4. Verify permissions in manifest.json

### Click Not Working

**Issue**: Folders or bookmarks not responding to clicks

**Solutions**:
1. Hard refresh the extension (remove and re-add)
2. Check console for JavaScript errors
3. Ensure all files are properly loaded
4. Verify event listeners are attached (check console logs)

### Search Not Working

**Issue**: Search results not appearing

**Solutions**:
1. Clear the search input and try again
2. Check for console errors
3. Verify bookmarks are loaded (check stats)
4. Reload extension

### Manager Won't Open

**Issue**: "Open Full Manager" button doesn't work

**Solutions**:
1. Check browser console for errors
2. Verify `background.js` is loaded
3. Check extension permissions
4. Reload extension

## 📝 Permissions

The extension requires the following permissions:

- **`bookmarks`**: Read and display bookmark data
- **`storage`**: Save user preferences (dark mode)
- **`tabs`**: Open bookmarks in new tabs

All permissions are necessary for core functionality and no data is collected or transmitted.

## 🔒 Privacy

- **No Data Collection**: Extension does not collect or transmit any data
- **Local Only**: All bookmark data stays in your browser
- **No Analytics**: No tracking or analytics tools
- **No External Requests**: Only fetches favicons from Google (standard Chrome behavior)
- **Open Source**: Code is fully transparent and auditable

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Coding Standards

- Use ES6+ JavaScript features
- Follow existing code style
- Add comments for complex logic
- Test changes thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## 🙏 Acknowledgments

- Inspired by Arc Browser's bookmark management
- Icons from Chrome's default icon set
- Favicon service by Google
- Built with love for better bookmark management

## 📊 Changelog

### Version 1.0.0 (Current)
- Initial release
- Tree-based bookmark navigation
- Dual-view mini panel
- Full-page manager interface
- Real-time search with highlighting
- Dark mode support
- Keyboard shortcuts

## 🗺️ Roadmap

### Planned Features
- [ ] Bookmark editing and deletion
- [ ] Custom folder creation
- [ ] Drag and drop reorganization
- [ ] Bookmark import/export
- [ ] Tags and categories
- [ ] Favorites/starred bookmarks
- [ ] Recent bookmarks view
- [ ] Bookmark statistics and analytics
- [ ] Custom themes
- [ ] Sync across devices

## 💬 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Search existing [Issues](https://github.com/yourusername/bookmarkdock/issues)
3. Open a new issue with detailed information
4. Contact: your.email@example.com

## ⭐ Show Your Support

If you find this extension helpful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting features
- 🤝 Contributing code
- 📢 Sharing with others

---

**Made with ❤️ for better bookmark management**