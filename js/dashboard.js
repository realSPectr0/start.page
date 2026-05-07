// ─── Dashboard controls ──────────────────────────────────────────────────────
(function () {
  const grid = document.getElementById('dashboardGrid');
  const addBtn = document.getElementById('widgetAddBtn');
  const resetBtn = document.getElementById('widgetResetBtn');
  const menu = document.getElementById('widgetMenu');
  const themeBtn = document.getElementById('themeToggle');
  const themeMenu = document.getElementById('themeMenu');

  if (!grid) return;

  const THEME_KEY = 'startpage:theme';
  const DASHBOARD_KEY = 'startpage:dashboardLayout';
  const THEMES = [
    { id: 'dark', label: 'Night', swatch: '#3E5060' },
    { id: 'light', label: 'Day', swatch: '#F5F5DC' },
    { id: 'coffee', label: 'Coffee', swatch: '#6F4E37' },
    { id: 'dusty-purple', label: 'Flins', swatch: 'linear-gradient(135deg, #3E5060 0%, #957DAD 60%, #F4C2C2 100%)' },
    { id: 'soft-navy', label: 'Neuvillette', swatch: '#3E5060' },
    { id: 'soft-pink', label: 'Candy', swatch: '#F4C2C2' },
    { id: 'sage-green', label: 'Mocha', swatch: '#B2AC88' },
    { id: 'columbina', label: 'Columbina', swatch: 'linear-gradient(135deg, #f8fbff 0%, #cfdcff 26%, #5f8ee5 58%, #7a78f4 82%, #b56be6 100%)' },
    { id: 'matcha', label: 'Matcha', swatch: 'linear-gradient(135deg, #3f5f40 0%, #4f7d50 34%, #87a87f 64%, #c8ddb8 100%)' },
    { id: 'cream', label: 'Cream', swatch: '#F5F5DC' },
  ];
  const GAP = 10;
  const MIN_WIDTH = 160;
  const MIN_HEIGHT = 76;
  const LANES = [
    { id: 'left',      x: 0,    w: 265 },
    { id: 'center',    x: 279,  w: 465 },
    { id: 'rightMain', x: 758,  w: 278 },
    { id: 'rightSide', x: 1050, w: 278 },
  ];
  const LANE_GAP = Math.max(GAP, LANES[1].x - (LANES[0].x + LANES[0].w));

  const WIDGETS = [
    { id: 'stats',    label: 'System Details' },
    { id: 'time',     label: 'Time' },
    { id: 'search',   label: 'Search Bar' },
    { id: 'pomodoro', label: 'Pomodoro' },
    { id: 'ai',       label: 'AI Shortcuts' },
    { id: 'media',    label: 'Music Player' },
    { id: 'notes',    label: 'Notes' },
    { id: 'tasks',    label: 'Tasks' },
    { id: 'bookmarks', label: 'Bookmarks' },
    { id: 'cyber',    label: 'Cyber Sec' },
    { id: 'photo',    label: 'Photo' },
  ];

  const DEFAULT_LAYOUT = {
    time:     { x: 0,   y: 0,   w: 265, h: 196, visible: true, z: 1 },
    search:   { x: 0,   y: 210, w: 265, h: 116, visible: true, z: 2 },
    stats:    { x: 0,   y: 340, w: 265, h: 330, visible: true, z: 3 },
    ai:       { x: 279, y: 0,   w: 465, h: 108, visible: true, z: 4 },
    pomodoro: { x: 279, y: 122, w: 465, h: 548, visible: true, z: 5 },
    tasks:    { x: 758, y: 0,   w: 278, h: 196, visible: true, z: 6 },
    notes:    { x: 758, y: 210, w: 278, h: 116, visible: true, z: 7 },
    media:    { x: 758, y: 340, w: 278, h: 330, visible: true, z: 8 },
    bookmarks:{ x: 1050,y: 0,   w: 278, h: 330, visible: true, z: 9 },
    cyber:    { x: 1050,y: 344, w: 278, h: 326, visible: true, z: 10 },
    photo:    { x: 1050,y: 0,   w: 278, h: 260, visible: false, z: 11 },
  };

  const widgetEls = new Map(
    [...document.querySelectorAll('[data-widget]')].map(el => [el.dataset.widget, el])
  );

  let state = loadState();

  applyTheme(loadTheme());
  applyAllWidgets();
  setupThemeToggle();
  setupThemeMenu();
  setupDrag();
  setupResizeHandles();
  setupDeleteButtons();
  setupResetButton();
  setupWidgetMenu();

  if (loadSavedLayout()) {
    reflowLayout();
    applyAllWidgets();
    saveState();
  }

  function loadState() {
    const saved = loadSavedLayout();
    const layout = Object.fromEntries(
      Object.entries(DEFAULT_LAYOUT).map(([id, layout]) => [
        id,
        normalizeLayout(saved?.[id] || layout),
      ])
    );
    return layout;
  }

  function loadSavedLayout() {
    try {
      const raw = localStorage.getItem(DASHBOARD_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function normalizeLayout(layout) {
    return {
      x: Number(layout.x) || 0,
      y: Number(layout.y) || 0,
      w: Math.max(Number(layout.w) || MIN_WIDTH, MIN_WIDTH),
      h: Math.max(Number(layout.h) || MIN_HEIGHT, MIN_HEIGHT),
      visible: layout.visible !== false,
      z: Number(layout.z) || 1,
    };
  }

  function loadTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY) || 'dark';
      if (saved === 'cappuccino') return 'coffee';
      if (saved === 'purple') return 'dusty-purple';
      if (saved === 'steel-blue') return 'columbina';
      return saved;
    } catch {
      return 'dark';
    }
  }

  function applyTheme(theme) {
    const nextTheme = THEMES.some(entry => entry.id === theme) ? theme : 'dark';
    document.body.dataset.theme = nextTheme;
    if (themeBtn) {
      const current = THEMES.find(entry => entry.id === nextTheme);
      const title = current ? `Theme: ${current.label}` : 'Theme';
      themeBtn.title = title;
      themeBtn.setAttribute('aria-label', title);
    }
    localStorage.setItem(THEME_KEY, nextTheme);
    renderThemeMenu();
  }

  function setupThemeToggle() {
    if (!themeBtn) return;
    themeBtn.addEventListener('click', () => {
      if (!themeMenu) return;
      const willOpen = !themeMenu.classList.contains('open');
      if (willOpen && menu) {
        menu.classList.remove('open');
        menu.setAttribute('aria-hidden', 'true');
      }
      setThemeMenuOpen(willOpen);
    });
  }

  function setupThemeMenu() {
    if (!themeMenu) return;

    document.addEventListener('click', e => {
      if (e.target.closest('#themeMenu') || e.target.closest('#themeToggle')) return;
      setThemeMenuOpen(false);
    });

    renderThemeMenu();
  }

  function setThemeMenuOpen(open) {
    if (!themeMenu) return;
    themeMenu.classList.toggle('open', open);
    themeMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  function renderThemeMenu() {
    if (!themeMenu) return;

    const currentTheme = document.body.dataset.theme || 'dark';
    themeMenu.innerHTML = '';
    THEMES.forEach(entry => {
      const button = document.createElement('button');
      button.className = 'theme-menu-item';
      button.classList.toggle('active', entry.id === currentTheme);
      button.innerHTML = `
        <span class="theme-menu-label">
          <span class="theme-swatch" style="--swatch:${entry.swatch}"></span>
          <span>${entry.label}</span>
        </span>
        <span class="theme-menu-state">${entry.id === currentTheme ? 'Selected' : 'Apply'}</span>
      `;
      button.addEventListener('click', () => {
        applyTheme(entry.id);
        setThemeMenuOpen(false);
      });
      themeMenu.appendChild(button);
    });
  }

  function applyAllWidgets() {
    Object.keys(DEFAULT_LAYOUT).forEach(applyWidget);
  }

  function applyWidget(id) {
    const el = widgetEls.get(id);
    const item = state[id];
    if (!el || !item) return;

    el.dataset.visible = item.visible ? 'true' : 'false';
    el.style.left = `${item.x}px`;
    el.style.top = `${item.y}px`;
    el.style.width = `${item.w}px`;
    el.style.height = `${item.h}px`;
    el.style.zIndex = item.z;
  }

  function saveState() {
    try {
      const next = {};
      Object.keys(DEFAULT_LAYOUT).forEach(id => {
        const item = state[id];
        next[id] = {
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          visible: item.visible,
          z: item.z,
        };
      });
      localStorage.setItem(DASHBOARD_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage failures and keep the UI usable.
    }
  }

  function setupDrag() {
    widgetEls.forEach((el, id) => {
      const handle = el.querySelector('.widget-drag-handle');
      if (!handle) return;

      handle.addEventListener('pointerdown', e => {
        if (e.button !== 0 || isInteractiveTarget(e.target)) return;
        startDrag(e, el, id);
      });
    });
  }

  function startDrag(e, el, id) {
    e.preventDefault();
    bringToFront(id);
    el.classList.add('dragging');

    const gridRect = grid.getBoundingClientRect();
    const startLeft = state[id].x;
    const startTop  = state[id].y;
    const offsetX   = e.clientX - (gridRect.left + startLeft);
    const offsetY   = e.clientY - (gridRect.top  + startTop);
    const startWidth  = state[id].w;
    const startHeight = state[id].h;

    el.style.position = 'fixed';
    el.style.left   = `${gridRect.left + startLeft}px`;
    el.style.top    = `${gridRect.top  + startTop}px`;
    el.style.width  = `${startWidth}px`;
    el.style.height = `${startHeight}px`;
    el.style.zIndex = '2600';

    let hoverId = null;

    function bestOverlapId(dragX, dragY) {
      let best = null, bestArea = 0;
      widgetEls.forEach((_, tid) => {
        if (tid === id || !state[tid] || state[tid].visible === false) return;
        const t = state[tid];
        const ox = Math.max(0, Math.min(dragX + startWidth, t.x + t.w) - Math.max(dragX, t.x));
        const oy = Math.max(0, Math.min(dragY + startHeight, t.y + t.h) - Math.max(dragY, t.y));
        const area = ox * oy;
        if (area > bestArea) { bestArea = area; best = tid; }
      });
      return best;
    }

    function move(ev) {
      const nextLeft = clamp(Math.round(ev.clientX - offsetX), 0, window.innerWidth  - startWidth);
      const nextTop  = clamp(Math.round(ev.clientY - offsetY), 0, window.innerHeight - startHeight);
      el.style.left = `${nextLeft}px`;
      el.style.top  = `${nextTop}px`;

      const dragX = nextLeft - gridRect.left;
      const dragY = nextTop  - gridRect.top;
      const newHover = bestOverlapId(dragX, dragY);

      if (newHover !== hoverId) {
        if (hoverId) widgetEls.get(hoverId)?.classList.remove('tile-target');
        hoverId = newHover;
        if (hoverId) widgetEls.get(hoverId)?.classList.add('tile-target');
      }
    }

    function stop() {
      el.classList.remove('dragging');
      if (hoverId) widgetEls.get(hoverId)?.classList.remove('tile-target');
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', stop);

      const nextLeft = parseFloat(el.style.left) || gridRect.left + startLeft;
      const nextTop  = parseFloat(el.style.top)  || gridRect.top  + startTop;
      el.style.position = '';
      el.style.left = el.style.top = el.style.width = el.style.height = el.style.zIndex = '';

      if (hoverId) {
        // Swap positions + sizes with the hovered widget
        const a = state[id], b = state[hoverId];
        [a.x, b.x] = [b.x, a.x];
        [a.y, b.y] = [b.y, a.y];
        [a.w, b.w] = [b.w, a.w];
        [a.h, b.h] = [b.h, a.h];
      } else {
        state[id].x = clamp(Math.round(nextLeft - gridRect.left), 0, gridRect.width  - state[id].w);
        state[id].y = clamp(Math.round(nextTop  - gridRect.top),  0, gridRect.height - state[id].h);
      }
      resolveCollisions(id);
      saveState();
    }

    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', stop, { once: true });
  }

  function setupResizeHandles() {
    widgetEls.forEach((el, id) => {
      const handle = document.createElement('div');
      handle.className = 'widget-resize-handle';
      handle.title = 'Resize widget';
      el.appendChild(handle);

      handle.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        startResize(e, el, id);
      });
    });
  }

  function startResize(e, el, id) {
    e.preventDefault();
    e.stopPropagation();
    bringToFront(id);
    el.classList.add('resizing');

    const gridRect = grid.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = state[id].w;
    const startH = state[id].h;

    let hoverId = null;

    function bestOverlapId() {
      let best = null, bestArea = 0;
      const a = state[id];
      widgetEls.forEach((_, tid) => {
        if (tid === id || !state[tid] || state[tid].visible === false) return;
        const b = state[tid];
        const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
        const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
        const area = ox * oy;
        if (area > bestArea) { bestArea = area; best = tid; }
      });
      return best;
    }

    function move(ev) {
      state[id].w = clamp(Math.round(startW + ev.clientX - startX), MIN_WIDTH, gridRect.width  - state[id].x);
      state[id].h = clamp(Math.round(startH + ev.clientY - startY), MIN_HEIGHT, gridRect.height - state[id].y);
      applyWidget(id);

      const newHover = bestOverlapId();
      if (newHover !== hoverId) {
        if (hoverId) widgetEls.get(hoverId)?.classList.remove('tile-target');
        hoverId = newHover;
        if (hoverId) widgetEls.get(hoverId)?.classList.add('tile-target');
      }
    }

    function stop() {
      el.classList.remove('resizing');
      if (hoverId) widgetEls.get(hoverId)?.classList.remove('tile-target');
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', stop);

      resolveCollisions(id);
      saveState();
    }

    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', stop, { once: true });
  }

  function resolveCollisions(activeId) {
    reflowLayout(activeId);
    applyAllWidgets();
  }

  function reflowLayout(anchorId = null) {
    const ids = visibleIds();
    if (!ids.length) return;

    const groups = buildColumnGroups(ids, anchorId);

    const totalWidth = groups.reduce((sum, group) => sum + group.w, 0) +
      LANE_GAP * Math.max(0, groups.length - 1);
    let cursorX = Math.max(0, Math.round((grid.clientWidth - totalWidth) / 2));

    groups.forEach(group => {
      group.items.sort((a, b) => {
        if (Math.abs(a.item.y - b.item.y) > 8) return a.item.y - b.item.y;
        if (Math.abs(a.item.x - b.item.x) > 8) return a.item.x - b.item.x;
        return a.id.localeCompare(b.id);
      });

      const totalWeight = group.items.reduce((sum, entry) => sum + Math.max(entry.item.h, MIN_HEIGHT), 0);
      const targetHeight = Math.max(
        group.bottom - group.top,
        MIN_HEIGHT * group.items.length + GAP * Math.max(0, group.items.length - 1)
      );
      const targetBottom = group.top + targetHeight;
      const availableHeight = targetHeight - GAP * Math.max(0, group.items.length - 1);
      let cursorY = group.top;

      group.items.forEach((entry, index) => {
        const item = entry.item;
        item.x = cursorX;
        item.y = cursorY;
        item.w = group.w;
        const weight = Math.max(item.h, MIN_HEIGHT);
        const remaining = group.items.length - index - 1;
        const remainingHeight = targetBottom - cursorY - GAP * remaining;
        const nextHeight = index === group.items.length - 1
          ? remainingHeight
          : Math.max(MIN_HEIGHT, Math.round(availableHeight * (weight / totalWeight)));
        item.h = Math.max(MIN_HEIGHT, nextHeight);
        cursorY += item.h + GAP;
      });
      cursorX += group.w + LANE_GAP;
    });

    visibleIds().forEach(id => clampToGrid(id, false));
  }

  function buildColumnGroups(ids, anchorId = null) {
    const entries = ids
      .map(id => ({ id, item: state[id] }))
      .sort((a, b) => centerX(a.item) - centerX(b.item));
    const groups = [];

    entries.forEach(entry => {
      const match = groups.find(group => belongsToColumn(entry.item, group));
      if (match) {
        match.items.push(entry);
        updateColumnGroup(match, anchorId);
      } else {
        const group = { items: [entry] };
        updateColumnGroup(group, anchorId);
        groups.push(group);
      }
    });

    return groups.sort((a, b) => a.center - b.center);
  }

  function belongsToColumn(item, group) {
    const width = Math.max(group.w, MIN_WIDTH);
    const overlap = Math.max(0, Math.min(item.x + item.w, group.right) - Math.max(item.x, group.left));
    const overlapRatio = overlap / Math.min(item.w, width);
    const distance = Math.abs(centerX(item) - group.center);
    return overlapRatio >= 0.55 || distance <= Math.max(56, Math.min(item.w, width) * 0.55);
  }

  function updateColumnGroup(group, anchorId = null) {
    const widths = group.items.map(entry => Math.max(entry.item.w, MIN_WIDTH));
    const maxWidth = Math.max(...widths);
    const maxGridWidth = Math.max(MIN_WIDTH, grid.clientWidth || maxWidth);
    const anchorEntry = anchorId ? group.items.find(entry => entry.id === anchorId) : null;
    const targetWidth = anchorEntry ? Math.max(anchorEntry.item.w, MIN_WIDTH) : maxWidth;

    group.w = clamp(Math.round(targetWidth), MIN_WIDTH, maxGridWidth);
    group.left = Math.min(...group.items.map(entry => entry.item.x));
    group.right = Math.max(...group.items.map(entry => entry.item.x + entry.item.w));
    group.top = Math.min(...group.items.map(entry => entry.item.y));
    group.bottom = Math.max(...group.items.map(entry => entry.item.y + entry.item.h));
    group.center = group.items.reduce((sum, entry) => sum + centerX(entry.item), 0) / group.items.length;
  }

  function centerX(item) {
    return item.x + item.w / 2;
  }

  function laneForItem(item) {
    const cx = item.x + item.w / 2;
    let best = { ...LANES[0], index: 0 };
    let bestDistance = Infinity;
    LANES.forEach((lane, index) => {
      const center = lane.x + lane.w / 2;
      const distance = Math.abs(cx - center);
      if (distance < bestDistance) {
        best = { ...lane, index };
        bestDistance = distance;
      }
    });
    return best;
  }

  function setupDeleteButtons() {
    widgetEls.forEach((el, id) => {
      const btn = el.querySelector('[data-widget-delete]');
      if (!btn) return;
      btn.addEventListener('click', e => {
        e.stopPropagation();
        state[id].visible = false;
        resolveCollisions();
        saveState();
        renderMenu();
      });
    });
  }

  function setupResetButton() {
    if (!resetBtn) return;

    resetBtn.addEventListener('click', e => {
      e.stopPropagation();
      localStorage.removeItem(DASHBOARD_KEY);

      // Centre the layout both horizontally and vertically within the grid.
      // Columns total 1328px wide; rows total 670px tall.
      const gw = grid.clientWidth;
      const gh = grid.clientHeight;
      const ox = Math.max(0, Math.round((gw - 1328) / 2));
      const oy = Math.max(0, Math.round((gh -  670) / 2));
      const c0 = ox;
      const c1 = ox + 279;
      const c2 = ox + 758;
      const c3 = ox + 1050;

      state = {
        time:     { x: c0, y: oy +   0, w: 265, h: 196, visible: true, z: 1  },
        search:   { x: c0, y: oy + 210, w: 265, h: 116, visible: true, z: 2  },
        stats:    { x: c0, y: oy + 340, w: 265, h: 330, visible: true, z: 3  },
        ai:       { x: c1, y: oy +   0, w: 465, h: 108, visible: true, z: 4  },
        pomodoro: { x: c1, y: oy + 122, w: 465, h: 548, visible: true, z: 5  },
        tasks:    { x: c2, y: oy +   0, w: 278, h: 196, visible: true, z: 6  },
        notes:    { x: c2, y: oy + 210, w: 278, h: 116, visible: true, z: 7  },
        media:    { x: c2, y: oy + 340, w: 278, h: 330, visible: true, z: 8  },
        bookmarks:{ x: c3, y: oy +   0, w: 278, h: 330, visible: true, z: 9  },
        cyber:    { x: c3, y: oy + 344, w: 278, h: 326, visible: true, z: 10 },
        photo:    { x: c3, y: oy + 590, w: 278, h: 260, visible: false, z: 11 },
      };

      widgetEls.forEach((el, id) => {
        const item = state[id];
        if (!item) return;
        el.dataset.visible = 'true';
        el.style.left   = item.x + 'px';
        el.style.top    = item.y + 'px';
        el.style.width  = item.w + 'px';
        el.style.height = item.h + 'px';
        el.style.zIndex = item.z;
      });

      saveState();
      renderMenu();
    });
  }

  function setupWidgetMenu() {
    if (!addBtn || !menu) return;

    addBtn.addEventListener('click', e => {
      e.stopPropagation();
      setThemeMenuOpen(false);
      menu.classList.toggle('open');
      menu.setAttribute('aria-hidden', menu.classList.contains('open') ? 'false' : 'true');
      renderMenu();
    });

    document.addEventListener('click', e => {
      if (e.target.closest('#widgetMenu') || e.target.closest('#widgetAddBtn')) return;
      menu.classList.remove('open');
      menu.setAttribute('aria-hidden', 'true');
    });

    renderMenu();
  }

  function renderMenu() {
    if (!menu) return;

    menu.innerHTML = '';
    WIDGETS.forEach(widget => {
      const isVisible = state[widget.id]?.visible !== false;
      const btn = document.createElement('button');
      btn.className = 'widget-menu-item';
      btn.disabled = isVisible;
      btn.innerHTML = `
        <span>${widget.label}</span>
        <span class="widget-menu-state">${isVisible ? 'Added' : 'Add'}</span>
      `;
      btn.addEventListener('click', () => {
        state[widget.id].visible = true;
        bringToFront(widget.id);
        reflowLayout();
        applyAllWidgets();
        saveState();
        renderMenu();
      });
      menu.appendChild(btn);
    });
  }

  function visibleIds() {
    return Object.keys(state).filter(id => state[id].visible !== false);
  }

  function overlaps(a, b) {
    return a.x < b.x + b.w + GAP &&
      a.x + a.w + GAP > b.x &&
      a.y < b.y + b.h + GAP &&
      a.y + a.h + GAP > b.y;
  }

  function clampToGrid(id, clampX = true) {
    const item = state[id];
    item.w = Math.min(Math.max(item.w, MIN_WIDTH), grid.clientWidth);
    item.h = Math.min(Math.max(item.h, MIN_HEIGHT), grid.clientHeight);
    if (clampX) item.x = clamp(item.x, 0, grid.clientWidth - item.w);
    item.y = clamp(item.y, 0, grid.clientHeight - item.h);
  }

  function bringToFront(id) {
    const maxZ = Math.max(...Object.values(state).map(item => Number(item.z) || 1));
    state[id].z = maxZ + 1;
  }

  function isInteractiveTarget(target) {
    return Boolean(target.closest('button, a, input, textarea, select, .engine-menu, .widget-resize-handle'));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  window.addEventListener('beforeunload', saveState);
})();
