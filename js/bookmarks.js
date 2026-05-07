// ─── Custom Bookmarks ────────────────────────────────────────────────────────
(function () {
  const addBtn = document.getElementById('addBookmarkBtn');
  const form = document.getElementById('bookmarkForm');
  const nameInput = document.getElementById('bookmarkName');
  const urlInput = document.getElementById('bookmarkUrl');
  const list = document.getElementById('bookmarkList');
  const widget = document.getElementById('mod-bookmarks');
  const viewBtn = document.getElementById('bookmarkViewToggle');

  if (!addBtn || !form || !list) return;

  const KEY = 'startpage:bookmarks';
  const VIEW_KEY = 'startpage:bookmarkView';
  const LOCAL_ICONS = [
    { icon: 'icons/liveoak.png', hosts: ['liveoakacademy.org', 'liveoakacademy.com', 'liveoak.org'], keywords: ['live oak', 'liveoak'] },
    { icon: 'icons/htb.webp', hosts: ['hackthebox.com'], keywords: ['hack the box', 'htb'] },
    { icon: 'icons/offsec.ico', hosts: ['offsec.com'], keywords: ['offsec', 'offensive security'] },
    { icon: 'icons/tryhackme.png', hosts: ['tryhackme.com'], keywords: ['tryhackme', 'try hack me', 'thm'] },
    { icon: 'icons/idktheflag.png', hosts: ['idktheflag.sh'], keywords: ['idktheflag', 'idk the flag', 'idktf'] },
    { icon: 'icons/github.png', hosts: ['github.com'], keywords: ['github'] },
    { icon: 'icons/gmail.png', hosts: ['mail.google.com'], keywords: ['gmail'] },
    { icon: 'icons/drive.png', hosts: ['drive.google.com'], keywords: ['drive', 'google drive'] },
    { icon: 'icons/classroom.png', hosts: ['classroom.google.com'], keywords: ['classroom'] },
    { icon: 'icons/duckduckgo.png', hosts: ['duckduckgo.com'], keywords: ['duckduckgo', 'duck duck go'] },
    { icon: 'icons/bing.png', hosts: ['bing.com'], keywords: ['bing'] },
    { icon: 'icons/brave.png', hosts: ['search.brave.com'], keywords: ['brave'] },
    { icon: 'icons/chatgpt.png', hosts: ['chat.openai.com', 'chatgpt.com'], keywords: ['chatgpt', 'chat gpt'] },
    { icon: 'icons/claude.png', hosts: ['claude.ai'], keywords: ['claude'] },
    { icon: 'icons/gemini.png', hosts: ['gemini.google.com'], keywords: ['gemini'] },
    { icon: 'icons/perplexity.png', hosts: ['perplexity.ai'], keywords: ['perplexity'] },
    { icon: 'icons/reddit.png', hosts: ['reddit.com'], keywords: ['reddit'] },
    { icon: 'icons/discord.png', hosts: ['discord.com'], keywords: ['discord'] },
    { icon: 'icons/whatsapp.png', hosts: ['web.whatsapp.com', 'whatsapp.com'], keywords: ['whatsapp', 'whats app'] },
    { icon: 'icons/spotify.png', hosts: ['open.spotify.com', 'spotify.com'], keywords: ['spotify'] },
    { icon: 'icons/google.png', hosts: ['google.com'], keywords: ['google'] },
  ];
  let bookmarks = load();
  let viewMode = loadViewMode();

  applyViewMode();

  addBtn.addEventListener('click', () => {
    form.classList.toggle('visible');
    if (form.classList.contains('visible')) nameInput.focus();
  });

  if (viewBtn) {
    viewBtn.addEventListener('click', () => {
      viewMode = viewMode === 'grid' ? 'list' : 'grid';
      saveViewMode();
      applyViewMode();
    });
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const label = nameInput.value.trim();
    const href = normalizeUrl(urlInput.value.trim());
    if (!label || !href) return;

    bookmarks.push({ label, href });
    save();
    render();

    nameInput.value = '';
    urlInput.value = '';
    form.classList.remove('visible');
  });

  render();

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(bookmarks));
  }

  function loadViewMode() {
    try {
      return localStorage.getItem(VIEW_KEY) === 'grid' ? 'grid' : 'list';
    } catch {
      return 'list';
    }
  }

  function saveViewMode() {
    try {
      localStorage.setItem(VIEW_KEY, viewMode);
    } catch {
      // Keep the toggle usable if storage is unavailable.
    }
  }

  function applyViewMode() {
    const isGrid = viewMode === 'grid';
    if (widget) widget.classList.toggle('bookmark-view-grid', isGrid);
    if (!viewBtn) return;

    viewBtn.title = isGrid ? 'Switch to list view' : 'Switch to grid view';
    viewBtn.setAttribute('aria-label', viewBtn.title);
    viewBtn.innerHTML = isGrid ? listIcon() : gridIcon();
  }

  function render() {
    list.innerHTML = '';

    if (!bookmarks.length) {
      [
        { label: 'GitHub', href: 'https://github.com' },
        { label: 'Gmail', href: 'https://mail.google.com' },
      ].forEach(bookmark => bookmarks.push(bookmark));
      save();
    }

    bookmarks.forEach((bookmark, index) => {
      const row = document.createElement('div');
      row.className = 'bookmark-item';

      const icon = makeBookmarkIcon(bookmark);

      const link = document.createElement('a');
      link.className = 'bookmark-link';
      link.href = bookmark.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = bookmark.label;

      const del = document.createElement('button');
      del.className = 'bookmark-delete';
      del.title = 'Remove bookmark';
      del.innerHTML = `
        <svg viewBox="0 0 9 9" fill="none">
          <line x1="1" y1="1" x2="8" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="8" y1="1" x2="1" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`;

      del.addEventListener('click', () => {
        bookmarks.splice(index, 1);
        save();
        render();
      });

      row.appendChild(icon);
      row.appendChild(link);
      row.appendChild(del);
      list.appendChild(row);
    });
  }

  function normalizeUrl(value) {
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  }

  function makeBookmarkIcon(bookmark) {
    const iconPath = localIconFor(bookmark);
    if (!iconPath) return makeIconBadge(bookmark);

    const icon = document.createElement('img');
    icon.className = 'bookmark-favicon';
    icon.alt = '';
    icon.src = iconPath;
    icon.addEventListener('error', () => {
      icon.replaceWith(makeIconBadge(bookmark));
    });
    return icon;
  }

  function localIconFor(bookmark) {
    const label = (bookmark.label || '').toLowerCase();
    const host = hostnameFor(bookmark.href);
    const match = LOCAL_ICONS.find(entry => {
      return hostMatches(host, entry.hosts) || entry.keywords.some(keyword => label.includes(keyword));
    });

    return match ? match.icon : '';
  }

  function hostnameFor(href) {
    try {
      const url = new URL(href);
      return url.hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  function hostMatches(host, hosts) {
    if (!host) return false;
    return hosts.some(target => host === target || host.endsWith(`.${target}`));
  }

  function makeIconBadge(bookmark) {
    const badge = document.createElement('span');
    badge.className = 'bookmark-icon-text';
    badge.textContent = iconInitial(bookmark);
    badge.setAttribute('aria-hidden', 'true');
    return badge;
  }

  function iconInitial(bookmark) {
    const label = (bookmark.label || '').trim();
    if (label) return label[0].toUpperCase();

    const host = hostnameFor(bookmark.href);
    return (host[0] || '?').toUpperCase();
  }

  function gridIcon() {
    return `
      <svg viewBox="0 0 16 16" fill="none">
        <rect x="2.5" y="2.5" width="4" height="4" rx="1" stroke="currentColor" stroke-width="1.4"/>
        <rect x="9.5" y="2.5" width="4" height="4" rx="1" stroke="currentColor" stroke-width="1.4"/>
        <rect x="2.5" y="9.5" width="4" height="4" rx="1" stroke="currentColor" stroke-width="1.4"/>
        <rect x="9.5" y="9.5" width="4" height="4" rx="1" stroke="currentColor" stroke-width="1.4"/>
      </svg>`;
  }

  function listIcon() {
    return `
      <svg viewBox="0 0 16 16" fill="none">
        <line x1="5.5" y1="4" x2="13" y2="4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <line x1="5.5" y1="8" x2="13" y2="8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <line x1="5.5" y1="12" x2="13" y2="12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <circle cx="3" cy="4" r="0.8" fill="currentColor"/>
        <circle cx="3" cy="8" r="0.8" fill="currentColor"/>
        <circle cx="3" cy="12" r="0.8" fill="currentColor"/>
      </svg>`;
  }
})();
