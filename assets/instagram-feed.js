// Lê data/instagram-feed.json e renderiza as thumbnails na seção #instagram-feed.
// Se o arquivo não existir ou a busca falhar, mantém o conteúdo estático já presente no HTML.
(function () {
  const FEED_URL = 'data/instagram-feed.json';
  const IG_PROFILE_URL = 'https://www.instagram.com/a.diana.blum/';

  function iconSvg() {
    return '<span class="ig-post-overlay"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.2" cy="6.8" r="1.1" fill="#fff" stroke="none"/></svg></span>';
  }

  function renderPosts(container, posts) {
    if (!posts || posts.length === 0) return;

    container.innerHTML = posts
      .map((post) => {
        const thumb = post.thumbnail_url || post.media_url;
        const link = post.permalink || IG_PROFILE_URL;
        const caption = (post.caption || 'Diana Blum no Instagram').replace(/"/g, '&quot;');

        return `
          <a class="ig-post" href="${link}" target="_blank" rel="noopener" title="${caption}" aria-label="Ver post no Instagram (abre em nova aba)">
            <img src="${thumb}" alt="${caption}" loading="lazy">
            ${iconSvg()}
          </a>
        `;
      })
      .join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('instagram-feed');
    if (!container) return;

    fetch(FEED_URL, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => renderPosts(container, data.posts))
      .catch((err) => {
        console.warn('Não foi possível carregar o feed do Instagram, mantendo conteúdo estático.', err);
      });
  });
})();
