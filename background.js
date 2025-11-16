// ============================================
// BACKGROUND SERVICE WORKER - FULLY CORRECTED
// Manifest V3 Compliant - Production Ready
// ============================================

// State management
let bookmarkCache = null;
let syncInProgress = false;
let pendingSync = false;

// ============================================
// BOOKMARK SYNCHRONIZATION (with debouncing)
// ============================================

/**
 * Sync bookmarks from Chrome API
 * Debounced to prevent multiple simultaneous syncs
 */
async function syncBookmarks() {
  // If sync already in progress, queue another sync
  if (syncInProgress) {
    pendingSync = true;
    return bookmarkCache;
  }

  syncInProgress = true;
  
  try {
    const tree = await chrome.bookmarks.getTree();
    bookmarkCache = tree;
    
    // Broadcast to all extension pages
    await broadcastEvent('BOOKMARKS_SYNCED', tree);
    
    return tree;
  } catch (error) {
    console.error('Failed to sync bookmarks:', error);
    return bookmarkCache; // Return cached version if available
  } finally {
    syncInProgress = false;
    
    // Process pending sync if requested during this sync
    if (pendingSync) {
      pendingSync = false;
      setTimeout(() => syncBookmarks(), 100); // Debounce 100ms
    }
  }
}

/**
 * Broadcast bookmark event to all listeners
 */
async function broadcastEvent(type, payload) {
  try {
    await chrome.runtime.sendMessage({ type, payload });
  } catch (error) {
    // Ignore "no receivers" errors (expected when no UIs are open)
    if (!error.message?.includes('Receiving end does not exist')) {
      console.warn(`Broadcast ${type} failed:`, error);
    }
  }
}

// ============================================
// BOOKMARK EVENT LISTENERS (all 5 events)
// ============================================

chrome.bookmarks.onCreated.addListener(async (id, bookmark) => {
  await syncBookmarks();
  await broadcastEvent('BOOKMARK_CREATED', { id, bookmark });
});

chrome.bookmarks.onRemoved.addListener(async (id, removeInfo) => {
  await syncBookmarks();
  await broadcastEvent('BOOKMARK_REMOVED', { id, removeInfo });
});

chrome.bookmarks.onChanged.addListener(async (id, changeInfo) => {
  await syncBookmarks();
  await broadcastEvent('BOOKMARK_CHANGED', { id, changeInfo });
});

chrome.bookmarks.onMoved.addListener(async (id, moveInfo) => {
  await syncBookmarks();
  await broadcastEvent('BOOKMARK_MOVED', { id, moveInfo });
});

chrome.bookmarks.onChildrenReordered.addListener(async (id, reorderInfo) => {
  await syncBookmarks();
  await broadcastEvent('BOOKMARK_REORDERED', { id, reorderInfo });
});

// ============================================
// INITIAL SYNC ON SERVICE WORKER STARTUP
// ============================================

syncBookmarks().then(() => {
  console.log('✅ Initial bookmark sync complete');
}).catch(error => {
  console.error('❌ Initial sync failed:', error);
});

// ============================================
// MESSAGE HANDLING (async with proper error handling)
// ============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(response => sendResponse(response))
    .catch(error => {
      console.error('Message handler error:', error);
      sendResponse({ success: false, error: error.message });
    });
  
  return true; // Keep channel open for async response
});

async function handleMessage(message, sender) {
  switch (message.type) {
    case 'OPEN_MANAGER':
      // Open full manager in a new tab (NOT a popup window)
      await chrome.tabs.create({ 
        url: chrome.runtime.getURL('manager.html') 
      });
      return { success: true };
      
    case 'GET_BOOKMARKS':
      // Ensure bookmarks are synced at least once
      if (!bookmarkCache) {
        await syncBookmarks();
      }
      return { success: true, data: bookmarkCache };
      
    default:
      return { success: false, error: 'Unknown message type' };
  }
}

console.log('🚀 BookmarkDock - Service worker ready');