// ============================================
// BOOKMARKDOCK MINI PANEL
// Clean design with working functionality
// ============================================

let allBookmarks = [];
let expandedFolders = new Set();
let searchQuery = '';
let currentTab = 'saved';

// DOM Elements
const content = document.getElementById('content');
const searchInput = document.getElementById('search-input');
const tabSaved = document.getElementById('tab-saved');
const tabBookmarks = document.getElementById('tab-bookmarks');
const openManagerBtn = document.getElementById('open-manager-btn');

// ============================================
// INITIALIZATION
// ============================================

async function init() {
    console.log('🚀 Mini panel initializing...');
    try {
        await loadBookmarks();
        render();
        setupEventListeners();
        checkDarkMode();
        console.log('✅ Mini panel ready');
    } catch (error) {
        console.error('❌ Init failed:', error);
        showError('Failed to initialize extension');
    }
}

// ============================================
// BOOKMARK LOADING
// ============================================

async function loadBookmarks() {
    try {
        console.log('📚 Loading bookmarks...');
        const response = await chrome.runtime.sendMessage({ type: 'GET_BOOKMARKS' });
        if (response && response.success) {
            allBookmarks = response.data || [];
            console.log('✅ Bookmarks loaded via background:', allBookmarks.length);
        } else {
            console.log('⚠️ Fallback to direct API');
            const tree = await chrome.bookmarks.getTree();
            allBookmarks = tree || [];
            console.log('✅ Bookmarks loaded directly:', allBookmarks.length);
        }
    } catch (error) {
        console.error('❌ Failed to load bookmarks:', error);
        allBookmarks = [];
    }
}

// ============================================
// RENDERING
// ============================================

function render() {
    if (!allBookmarks || allBookmarks.length === 0) {
        showEmptyState('No bookmarks found');
        return;
    }

    if (searchQuery) {
        renderSearchResults();
    } else if (currentTab === 'saved') {
        renderSavedBookmarksAsList();
    } else {
        renderBookmarksAsTree();
    }
}

function showEmptyState(message) {
    content.innerHTML = `
        <div class="empty-state">
            <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
            </svg>
            <div class="empty-text">${message}</div>
        </div>
    `;
}

function showError(message) {
    content.innerHTML = `
        <div class="empty-state">
            <div class="empty-text" style="color: #ef4444;">${message}</div>
        </div>
    `;
}

function renderSavedBookmarksAsList() {
    const bookmarks = getAllBookmarkItems(allBookmarks);
    if (bookmarks.length === 0) {
        showEmptyState('No saved bookmarks');
        return;
    }

    const bookmarksHTML = bookmarks.slice(0, 50).map(bookmark => {
        return renderBookmarkItem(bookmark, false);
    }).join('');

    content.innerHTML = bookmarksHTML;
    attachBookmarkClickHandlers();
}

function renderBookmarksAsTree() {
    const treeHTML = renderTreeNodes(allBookmarks, 0);
    if (!treeHTML.trim()) {
        showEmptyState('No bookmark folders');
        return;
    }
    
    content.innerHTML = treeHTML;
    attachAllClickHandlers();
}

function renderSearchResults() {
    const results = searchBookmarks();
    if (results.length === 0) {
        showEmptyState(`No results for "${searchQuery}"`);
        return;
    }

    const resultsHTML = results.map(item => {
        if (item.url) {
            return renderBookmarkItem(item, true);
        } else {
            return renderFolderItem(item, 0, true);
        }
    }).join('');

    content.innerHTML = resultsHTML;
    attachAllClickHandlers();
}

function renderTreeNodes(nodes, depth) {
    if (!nodes || !Array.isArray(nodes)) return '';
    
    return nodes.map(node => {
        // Skip ONLY the root container (id: 0), show everything else
        if (depth === 0 && node.id === '0') {
            // Render children of root directly
            return node.children ? renderTreeNodes(node.children, depth) : '';
        }

        if (node.children) {
            return renderFolderTreeItem(node, depth);
        } else if (node.url) {
            return renderBookmarkTreeItem(node, depth);
        }
        return '';
    }).join('');
}

function renderFolderTreeItem(folder, depth) {
    const isExpanded = expandedFolders.has(folder.id);
    const indentClass = depth > 0 ? `indent-${Math.min(depth, 4)}` : '';
    const bookmarkCount = getBookmarkCount(folder);
    
    let childrenHTML = '';
    if (isExpanded && folder.children) {
        childrenHTML = renderTreeNodes(folder.children, depth + 1);
    }

    return `
        <div>
            <div class="bookmark-item folder-item ${indentClass}" data-folder-id="${folder.id}" data-type="folder">
                <svg class="folder-arrow ${isExpanded ? 'expanded' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
                <svg class="folder-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
                </svg>
                <div class="bookmark-title">${highlightSearchTerm(folder.title)}</div>
                <div class="bookmark-count">${bookmarkCount}</div>
            </div>
            ${childrenHTML}
        </div>
    `;
}

function renderBookmarkTreeItem(bookmark, depth) {
    const indentClass = depth > 0 ? `indent-${Math.min(depth + 1, 4)}` : '';
    return renderBookmarkItem(bookmark, true, indentClass);
}

function renderBookmarkItem(bookmark, showUrl = false, extraClass = '') {
    const favicon = getFavicon(bookmark.url);
    const hostname = getHostname(bookmark.url);
    const highlightedTitle = highlightSearchTerm(bookmark.title);

    return `
        <div class="bookmark-item ${extraClass}" data-url="${escapeHtml(bookmark.url)}" data-type="bookmark">
            <img src="${favicon}" class="bookmark-favicon" alt="" onerror="this.style.display='none';">
            <div class="flex-1 min-w-0">
                <div class="bookmark-title">${highlightedTitle}</div>
                ${showUrl ? `<div class="bookmark-url">${hostname}</div>` : ''}
            </div>
        </div>
    `;
}

function renderFolderItem(folder, depth, isSearch) {
    const bookmarkCount = getBookmarkCount(folder);
    const highlightedTitle = highlightSearchTerm(folder.title);

    return `
        <div class="bookmark-item folder-item" data-folder-id="${folder.id}" data-type="folder">
            <svg class="folder-icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
            </svg>
            <div class="bookmark-title">${highlightedTitle}</div>
            <div class="bookmark-count">${bookmarkCount}</div>
        </div>
    `;
}

// ============================================
// EVENT HANDLERS
// ============================================

function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Tab switching
    if (tabSaved) {
        tabSaved.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab('saved');
        });
    }
    
    if (tabBookmarks) {
        tabBookmarks.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab('bookmarks');
        });
    }

    // Search
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchQuery = e.target.value.trim().toLowerCase();
                render();
            }, 250);
        });
    }

    // Open manager
    if (openManagerBtn) {
        openManagerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🖱️ Opening manager...');
            chrome.runtime.sendMessage({ type: 'OPEN_MANAGER' })
                .then(response => {
                    console.log('✅ Manager opened:', response);
                })
                .catch(error => {
                    console.error('❌ Failed to open manager:', error);
                });
        });
    }

    console.log('✅ Event listeners ready');
}

function attachBookmarkClickHandlers() {
    content.querySelectorAll('[data-type="bookmark"]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const url = item.dataset.url;
            if (url) {
                console.log('🔗 Opening bookmark:', url);
                chrome.tabs.create({ url })
                    .then(() => console.log('✅ Bookmark opened'))
                    .catch(error => console.error('❌ Failed to open bookmark:', error));
            }
        });
    });
}

function attachFolderClickHandlers() {
    content.querySelectorAll('[data-type="folder"]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const folderId = item.dataset.folderId;
            if (folderId) {
                console.log('📁 Toggling folder:', folderId);
                toggleFolder(folderId);
            }
        });
    });
}

function attachAllClickHandlers() {
    attachBookmarkClickHandlers();
    attachFolderClickHandlers();
}

function switchTab(tab) {
    console.log('🔄 Switching to tab:', tab);
    currentTab = tab;

    // Update tab appearance
    if (tabSaved && tabBookmarks) {
        tabSaved.classList.remove('active');
        tabBookmarks.classList.remove('active');

        if (tab === 'saved') {
            tabSaved.classList.add('active');
        } else {
            tabBookmarks.classList.add('active');
        }
    }

    render();
}

function toggleFolder(folderId) {
    if (expandedFolders.has(folderId)) {
        expandedFolders.delete(folderId);
    } else {
        expandedFolders.add(folderId);
    }
    render();
}

// ============================================
// SEARCH
// ============================================

function searchBookmarks() {
    const results = [];
    searchInNodes(allBookmarks, results);
    return results.slice(0, 50); // Limit results
}

function searchInNodes(nodes, results) {
    if (!nodes || !Array.isArray(nodes)) return;
    
    for (const node of nodes) {
        if (node.children) {
            if (node.title && node.title.toLowerCase().includes(searchQuery)) {
                results.push(node);
            }
            searchInNodes(node.children, results);
        } else if (node.url) {
            if ((node.title && node.title.toLowerCase().includes(searchQuery)) ||
                (node.url && node.url.toLowerCase().includes(searchQuery)) ||
                getHostname(node.url).toLowerCase().includes(searchQuery)) {
                results.push(node);
            }
        }
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getAllBookmarkItems(nodes) {
    if (!nodes || !Array.isArray(nodes)) return [];
    
    const items = [];
    for (const node of nodes) {
        if (node.url) {
            items.push(node);
        }
        if (node.children) {
            items.push(...getAllBookmarkItems(node.children));
        }
    }
    return items;
}

function getBookmarkCount(folder) {
    if (!folder || !folder.children) return 0;

    let count = 0;
    for (const child of folder.children) {
        if (child.url) {
            count++;
        } else if (child.children) {
            count += getBookmarkCount(child);
        }
    }
    return count;
}

function highlightSearchTerm(text) {
    if (!searchQuery || !text) return escapeHtml(text);

    const escapedText = escapeHtml(text);
    const regex = new RegExp(`(${escapeRegex(searchQuery)})`, 'gi');
    return escapedText.replace(regex, '<mark style="background: rgba(255, 193, 7, 0.3); font-weight: 500;">$1</mark>');
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getFavicon(url) {
    if (!url) return '';
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
        return '';
    }
}

function getHostname(url) {
    if (!url) return '';
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function checkDarkMode() {
    try {
        const isDark = localStorage.getItem('darkMode') === 'true' ||
                       window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (isDark) {
            document.documentElement.classList.add('dark');
        }
    } catch (error) {
        console.warn('Dark mode check failed:', error);
    }
}

// ============================================
// INITIALIZE
// ============================================

// Wait for DOM and initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}