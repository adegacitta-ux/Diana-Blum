/**
 * Instagram Feed Integration
 * Fetches posts and reels from Instagram Business Account using Graph API
 * 
 * Setup:
 * 1. Create Facebook App: https://developers.facebook.com/
 * 2. Connect Instagram Business Account
 * 3. Generate Access Token with instagram_basic scope
 * 4. Set your Instagram User ID and Access Token below
 * 5. Deploy to production
 */

const INSTAGRAM_CONFIG = {
  // Get these from Facebook Developer Console
  userId: 'YOUR_INSTAGRAM_USER_ID', // Find at https://developers.facebook.com/tools/instagram-graph-api-explorer/
  accessToken: 'YOUR_ACCESS_TOKEN', // Generate with instagram_basic scope
  apiVersion: 'v19.0',
  cacheTime: 3600000 // 1 hour cache
};

/**
 * Fetch posts from Instagram Graph API
 * @param {number} limit - Number of posts to fetch
 * @returns {Promise<Array>} Array of Instagram posts
 */
async function fetchInstagramPosts(limit = 9) {
  // Check if config is set
  if (INSTAGRAM_CONFIG.userId === 'YOUR_INSTAGRAM_USER_ID' || 
      INSTAGRAM_CONFIG.accessToken === 'YOUR_ACCESS_TOKEN') {
    console.warn('Instagram API not configured. Using fallback thumbnails.');
    return [];
  }

  // Check cache first
  const cache = sessionStorage.getItem('instagram_feed_cache');
  const cacheTime = sessionStorage.getItem('instagram_feed_cache_time');
  
  if (cache && cacheTime && Date.now() - parseInt(cacheTime) < INSTAGRAM_CONFIG.cacheTime) {
    return JSON.parse(cache);
  }

  try {
    const response = await fetch(
      `https://graph.instagram.com/${INSTAGRAM_CONFIG.apiVersion}/${INSTAGRAM_CONFIG.userId}/media`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }

    const params = new URLSearchParams({
      fields: 'id,caption,media_type,media_url,thumbnail_url,timestamp,permalink',
      access_token: INSTAGRAM_CONFIG.accessToken
    });

    const apiUrl = `https://graph.instagram.com/${INSTAGRAM_CONFIG.apiVersion}/${INSTAGRAM_CONFIG.userId}/media?${params}`;
    
    const data = await fetch(apiUrl).then(res => res.json());

    if (data.error) {
      console.error('Instagram API Error:', data.error.message);
      return [];
    }

    const posts = data.data?.slice(0, limit) || [];

    // Cache the result
    sessionStorage.setItem('instagram_feed_cache', JSON.stringify(posts));
    sessionStorage.setItem('instagram_feed_cache_time', Date.now().toString());

    return posts;
  } catch (error) {
    console.error('Failed to fetch Instagram feed:', error);
    return [];
  }
}

/**
 * Render Instagram feed dynamically
 */
async function renderInstagramFeed() {
  const feedContainer = document.getElementById('instagram-feed');
  const reelsContainer = document.getElementById('instagram-reels');

  if (!feedContainer && !reelsContainer) {
    return;
  }

  const posts = await fetchInstagramPosts(9);

  if (posts.length === 0) {
    console.log('No posts fetched. Using static fallback.');
    return; // Use static HTML fallback
  }

  // Separate posts and reels
  const imagePosts = posts.filter(p => p.media_type === 'IMAGE').slice(0, 3);
  const videoPosts = posts.filter(p => p.media_type === 'VIDEO' || p.media_type === 'CAROUSEL_ALBUM').slice(0, 2);

  // Render feed (images)
  if (feedContainer && imagePosts.length > 0) {
    feedContainer.innerHTML = imagePosts.map(post => `
      <a class="ig-post" 
         href="${post.permalink}" 
         target="_blank" 
         rel="noopener" 
         title="${post.caption || 'Instagram post'}"
         aria-label="${post.caption || 'Instagram post'} (abre em nova aba)">
        <img src="${post.media_url}" 
             alt="${post.caption || 'Diana Blum no Instagram'}" 
             loading="lazy">
        <span class="ig-post-overlay">
          <svg viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="5"/>
            <circle cx="12" cy="12" r="4.2"/>
            <circle cx="17.2" cy="6.8" r="1.1" fill="#fff" stroke="none"/>
          </svg>
        </span>
      </a>
    `).join('');
  }

  // Render reels (videos)
  if (reelsContainer && videoPosts.length > 0) {
    reelsContainer.innerHTML = videoPosts.map(post => `
      <a class="ig-reel" 
         href="${post.permalink}" 
         target="_blank" 
         rel="noopener" 
         title="${post.caption || 'Instagram reel'}"
         aria-label="${post.caption || 'Instagram reel'} (abre em nova aba)">
        <img src="${post.thumbnail_url || post.media_url}" 
             alt="${post.caption || 'Diana Blum reel'}" 
             loading="lazy">
        <span class="ig-reel-play">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </span>
      </a>
    `).join('');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  renderInstagramFeed();
});

// Optional: Refresh feed every hour
setInterval(function() {
  sessionStorage.removeItem('instagram_feed_cache');
  sessionStorage.removeItem('instagram_feed_cache_time');
  renderInstagramFeed();
}, 3600000);
