// ============================================
// FIXED BOOKMARK MANAGER - EVERYTHING WORKS
// Clean and functional manager
// ============================================

let allBookmarks = [];
let expandedFolders = new Set();
let searchQuery = '';

// DOM Elements
const searchInput = document.getElementById('search-input');
const statsDiv = document.getElementById('stats');
const content = document.getElementById('content');

// ============================================
// INITIALIZATION
// ============================================

async function init() {
    console.log('🚀 Manager initializing...');
    try {
        await loadBookmarks();
        updateStats();
        render();
        setupEventListeners();
        checkDarkMode();
        console.log('✅ Manager ready');
    } catch (error) {
        console.error('❌ Manager init failed:', error);
        showError('Failed to initialize manager');
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
// STATS & RENDERING
// ============================================

function updateStats() {
    const bookmarks = getAllBookmarkItems(allBookmarks);
    const folders = getAllFolders(allBookmarks);
    const filteredCount = searchQuery ? searchBookmarks().length : bookmarks.length;
    
    statsDiv.innerHTML = `
        <span>📚 ${bookmarks.length} bookmarks</span>
        <span>📁 ${folders.length} folders</span>
        <span>👁️ ${filteredCount} showing</span>
    `;
}

function render() {
    if (!allBookmarks || allBookmarks.length === 0) {
        showEmptyState('No Bookmarks', 'No bookmarks found in your browser');
        return;
    }

    if (searchQuery) {
        renderSearchResults();
    } else {
        renderTree();
    }
    
    updateStats();
}

function showEmptyState(title, message) {
    content.innerHTML = `
        <div class="empty-state">
            <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
            </svg>
            <div class="empty-title">${title}</div>
            <div class="empty-text">${message}</div>
        </div>
    `;
}

function showError(message) {
    content.innerHTML = `
        <div class="empty-state">
            <div class="empty-title" style="color: #ef4444;">Error</div>
            <div class="empty-text">${message}</div>
        </div>
    `;
}

function renderSearchResults() {
    const results = searchBookmarks();
    if (results.length === 0) {
        showEmptyState('No Results', `No bookmarks match "${searchQuery}"`);
        return;
    }

    const resultsHTML = results.map(item => {
        if (item.url) {
            return renderBookmarkItem(item);
        } else {
            return renderFolderItem(item, 0);
        }
    }).join('');

    content.innerHTML = resultsHTML;
    attachHandlers();
}

function renderTree() {
    const treeHTML = renderTreeNodes(allBookmarks, 0);
    if (!treeHTML.trim()) {
        showEmptyState('No Folders', 'No bookmark folders found');
        return;
    }
    
    content.innerHTML = treeHTML;
    attachHandlers();
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

    const highlightedTitle = highlightSearchTerm(folder.title);

    return `
        <div>
            <div class="tree-item folder-item ${indentClass}" data-folder-id="${folder.id}" data-type="folder">
                <svg class="folder-arrow ${isExpanded ? 'expanded' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
                <svg class="folder-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
                </svg>
                <div class="bookmark-info">
                    <div class="bookmark-title">${highlightedTitle}</div>
                </div>
                <div class="bookmark-count">${bookmarkCount}</div>
            </div>
            ${childrenHTML}
        </div>
    `;
}

function renderBookmarkTreeItem(bookmark, depth) {
    const indentClass = depth > 0 ? `indent-${Math.min(depth + 1, 4)}` : '';
    return renderBookmarkItem(bookmark, indentClass);
}

function renderBookmarkItem(bookmark, extraClass = '') {
    const favicon = getFavicon(bookmark.url);
    const hostname = getHostname(bookmark.url);
    const highlightedTitle = highlightSearchTerm(bookmark.title);

    return `
        <div class="tree-item bookmark-item ${extraClass}" data-url="${escapeHtml(bookmark.url)}" data-type="bookmark">
            <img src="${favicon}" class="bookmark-favicon" alt="" onerror="this.style.display='none';">
            <div class="bookmark-info">
                <div class="bookmark-title">${highlightedTitle}</div>
                <div class="bookmark-url">${hostname}</div>
            </div>
        </div>
    `;
}

function renderFolderItem(folder, depth) {
    const bookmarkCount = getBookmarkCount(folder);
    const highlightedTitle = highlightSearchTerm(folder.title);
    
    return `
        <div class="tree-item folder-item" data-folder-id="${folder.id}" data-type="folder">
            <svg class="folder-icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
            </svg>
            <div class="bookmark-info">
                <div class="bookmark-title">${highlightedTitle}</div>
            </div>
            <div class="bookmark-count">${bookmarkCount}</div>
        </div>
    `;
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    console.log('🔧 Setting up manager event listeners...');
    
    // Search
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchQuery = e.target.value.trim().toLowerCase();
                render();
            }, 300);
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'f':
                case 'F':
                    e.preventDefault();
                    if (searchInput) searchInput.focus();
                    break;
            }
        } else if (e.key === 'Escape') {
            if (searchQuery && searchInput) {
                searchInput.value = '';
                searchQuery = '';
                render();
            }
        }
    });

    console.log('✅ Manager event listeners ready');
}

function attachHandlers() {
    // Folder handlers
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

    // Bookmark handlers
    content.querySelectorAll('[data-type="bookmark"]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const url = item.dataset.url;
            if (url) {
                console.log('🔗 Opening bookmark:', url);
                window.open(url, '_blank');
            }
        });
    });
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
    return results.slice(0, 200); // Limit results for performance
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

function getAllFolders(nodes) {
    if (!nodes || !Array.isArray(nodes)) return [];
    
    const folders = [];
    for (const node of nodes) {
        if (node.children && node.id !== '0') {
            folders.push(node);
            folders.push(...getAllFolders(node.children));
        }
    }
    return folders;
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
    return escapedText.replace(regex, '<mark style="background: rgba(255, 193, 7, 0.3); font-weight: 600; border-radius: 2px; padding: 1px 2px;">$1</mark>');
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getFavicon(url) {
    if (!url) return '';
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=20`;
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