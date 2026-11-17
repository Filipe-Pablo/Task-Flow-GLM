/* ============ TASKFLOW — APP (navigation, views, wiring) ============ */

/* ---------- Inline SVG icon set (assets/icons mirrored) ---------- */
const svg = (d, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${extra}${d}</svg>`;

window.ICONS = {
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  plusSm: svg('<path d="M12 5v14M5 12h14"/>'),
  x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  check: svg('<path d="M20 6 9 17l-5-5"/>'),
  'check-circle': svg('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>'),
  dashboard: svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
  tasks: svg('<path d="M21 12a9 9 0 1 1-9-9"/><path d="m9 11 3 3L22 4"/>'),
  calendar: svg('<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>'),
  history: svg('<path d="M3 3v6h6"/><path d="M3.5 12a9 9 0 1 0 2.1-5.8L3 9"/><path d="M12 7v5l4 2"/>'),
  folder: svg('<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-3H4a2 2 0 0 0-2 3v12a2 2 0 0 0 2 2Z"/>'),
  settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
  bell: svg('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>'),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>'),
  pencil: svg('<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>'),
  trash: svg('<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/>'),
  reopen: svg('<path d="M3 3v6h6"/><path d="M3.5 12a9 9 0 1 0 2.1-5.8L3 9"/>'),
  menu: svg('<path d="M3 6h18M3 12h18M3 18h18"/>'),
  list: svg('<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>'),
  grid: svg('<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>'),
  inbox: svg('<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.4 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.4-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.8 1.1Z"/>'),
  alert: svg('<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>'),
  zap: svg('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>'),
  target: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  chart: svg('<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/>')
};

const App = (() => {
  const VIEWS = {
    dashboard:  { title: 'Dashboard Overview' },
    mytasks:    { title: 'My Tasks' },
    today:      { title: 'Today' },
    upcoming:   { title: 'Upcoming Tasks' },
    completed:  { title: 'Completed' },
    categories: { title: 'Categories' },
    profile:    { title: 'Profile' },
    settings:   { title: 'Settings' }
  };

  let currentView = 'dashboard';

  /* ---------- profile / greeting ---------- */
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const initials = (name) =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'TF';

  const syncProfile = () => {
    const p = Storage.getProfile();
    document.getElementById('sidebarUserName').textContent = p.name;
    document.getElementById('headerGreet').textContent = `${greeting()}, ${p.name.split(' ')[0]}`;
    const init = initials(p.name);
    document.getElementById('avatarSidebar').textContent = init;
    document.getElementById('avatarHeader').textContent = init;
    const prof = document.getElementById('profileAvatar');
    if (prof) prof.textContent = init;
  };

  /* ---------- sidebar categories & badges ---------- */
  const syncSidebar = () => {
    const cats = Storage.getCategories();
    const tasks = Tasks.all();
    const wrap = document.getElementById('navCategories');
    wrap.innerHTML = cats
      .map((c) => {
        const count = tasks.filter((t) => t.category === c.id && t.status !== 'completed').length;
        return `<a href="#categories" class="nav-cat" data-action="filter-cat" data-id="${c.id}">
          <span class="cat-dot" style="background:${c.color}"></span>
          <span>${Tasks.escapeHTML(c.name)}</span>
          <span class="nav-badge" style="margin-left:auto">${count}</span>
        </a>`;
      })
      .join('');

    const open = tasks.filter((t) => t.status !== 'completed');
    const badges = {
      mytasks: open.length,
      today: open.filter((t) => Tasks.isToday(t) || Tasks.isOverdue(t)).length,
      upcoming: open.filter((t) => t.dueDate && Tasks.daysBetween(t.dueDate) > 0).length,
      completed: tasks.filter((t) => t.status === 'completed').length
    };
    document.querySelectorAll('[data-badge]').forEach((el) => {
      const v = badges[el.dataset.badge];
      if (v !== undefined) el.textContent = v;
    });

    // notification dot: overdue or due today
    const urgent = badges.today > 0;
    document.getElementById('notifDot').hidden = !urgent;
  };

  /* ---------- navigation ---------- */
  const navigate = (view, opts = {}) => {
    if (!VIEWS[view]) view = 'dashboard';
    currentView = view;
    location.hash = view;

    document.querySelectorAll('.nav-item').forEach((n) =>
      n.classList.toggle('active', n.dataset.view === view));

    document.getElementById('pageTitle').textContent = VIEWS[view].title;

    const content = document.getElementById('appContent');
    content.innerHTML = RENDERERS[view](opts);
    wireView(content);
    content.scrollTop = 0;
  };

  const refresh = () => {
    syncSidebar();
    syncProfile();
    navigate(currentView, { keep: true });
  };

  /* ================= VIEW RENDERERS ================= */
  const statCard = (label, value, icon, variant, footer) => `
    <div class="stat-card">
      <div class="stat-card__top">
        <span class="stat-card__label">${label}</span>
        <span class="stat-icon stat-icon--${variant}">${icon}</span>
      </div>
      <span class="stat-card__value">${value}</span>
      <div class="stat-card__footer">${footer || ''}</div>
    </div>`;

  const RENDERERS = {
    dashboard() {
      const tasks = Tasks.all();
      const open = tasks.filter((t) => t.status !== 'completed');
      const done = tasks.filter((t) => t.status === 'completed');
      const overdue = tasks.filter(Tasks.isOverdue);
      const dueToday = open.filter((t) => Tasks.isToday(t));
      const pct = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
      const addedWeek = tasks.filter(
        (t) => t.createdAt && Tasks.daysBetween(t.createdAt) >= -7
      ).length;
      const urgent = overdue.length + dueToday.length;
      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
      });

      const ring = `
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="22" fill="none" stroke="var(--hover)" stroke-width="5"/>
          <circle cx="26" cy="26" r="22" fill="none" stroke="${pct >= 70 ? 'var(--success)' : 'var(--primary)'}"
            stroke-width="5" stroke-linecap="round"
            stroke-dasharray="${2 * Math.PI * 22}" stroke-dashoffset="${2 * Math.PI * 22 * (1 - pct / 100)}"/>
        </svg><span class="velocity__pct">${pct}%</span>`;

      const recent = [...tasks]
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        .slice(0, 5);

      // productivity summary per category
      const cats = Storage.getCategories().map((c) => {
        const all = tasks.filter((t) => t.category === c.id);
        const ok = all.filter((t) => t.status === 'completed').length;
        return { ...c, total: all.length, done: ok, pct: all.length ? Math.round((ok / all.length) * 100) : 0 };
      }).filter((c) => c.total > 0);

      return `
        <section class="welcome-banner">
          <div class="welcome-banner__main">
            <span class="welcome-banner__tag">Active Workspace</span>
            <h2>${greeting()}, ${Storage.getProfile().name.split(' ')[0]}!</h2>
            <p class="welcome-banner__sub">${today} — Here's what's happening with your tasks today.
              You have <strong>${urgent} urgent ${urgent === 1 ? 'deadline' : 'deadlines'}</strong> and your
              completion rate is <strong>${pct}%</strong>.</p>
          </div>
          <div class="welcome-banner__extra" style="display:flex;align-items:center;gap:14px">
            <div class="velocity">
              <div>
                <div class="velocity__label">Completion</div>
                <div class="velocity__value">${done.length}/${tasks.length}</div>
              </div>
              <div class="velocity__ring">${ring}</div>
            </div>
            <button class="btn btn--primary" data-action="open-create">${ICONS.plus} New Task</button>
          </div>
        </section>

        <div class="stats-grid">
          ${statCard('Total Tasks', tasks.length, ICONS.tasks, 'primary',
            `<span class="stat-note"><strong>+${addedWeek}</strong> added this week</span>`)}
          ${statCard('Completed', done.length, ICONS['check-circle'], 'success',
            `<span class="progress"><span class="progress__bar progress__bar--success" style="width:${pct}%"></span></span>
             <span class="stat-note">${pct}%</span>`)}
          ${statCard('In Progress', tasks.filter((t) => t.status === 'inprogress').length, ICONS.clock, 'warning',
            `<span class="stat-note">${dueToday.length} due today</span>`)}
          ${statCard('Overdue', overdue.length, ICONS.alert, 'danger',
            `<span class="stat-note">${overdue.length ? 'Requires immediate action' : 'All caught up!'}</span>`)}
        </div>

        <div class="panel" style="margin-bottom:16px">
          <div class="view-head" style="margin-bottom:12px">
            <h2 style="font-size:15px">Productivity Summary</h2>
            <span class="stat-note">${pct}% of all tasks completed</span>
          </div>
          ${cats.length ? cats.map((c) => `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
              <span class="cat-dot" style="background:${c.color}"></span>
              <span style="width:90px;font-weight:600;font-size:13px">${Tasks.escapeHTML(c.name)}</span>
              <span class="progress"><span class="progress__bar" style="width:${c.pct}%"></span></span>
              <span class="stat-note" style="width:64px;text-align:right">${c.done}/${c.total}</span>
            </div>`).join('')
          : '<p class="stat-note">No category data yet.</p>'}
        </div>

        <div class="panel">
          <div class="view-head" style="margin-bottom:12px">
            <h2 style="font-size:15px">Recent Tasks</h2>
            <button class="btn btn--ghost btn--sm" data-nav="mytasks">View all</button>
          </div>
          ${Tasks.renderList(recent, {
            mode: Filters.state.view,
            emptyTitle: 'No tasks yet',
            emptyText: 'Click “New Task” to create your first task.'
          })}
        </div>`;
    },

    mytasks() {
      const tasks = Tasks.all();
      const counts = Filters.countByStatus(tasks);
      const filtered = Filters.apply(tasks);
      const cats = Storage.getCategories();
      const f = Filters.state;

      const chip = (key, label) =>
        `<button class="chip ${f.status === key ? 'active' : ''}" data-chip="${key}">${label} (${counts[key]})</button>`;

      return `
        <div class="toolbar">
          <div class="toolbar__title">
            <h3>${ICONS.list} Tasks</h3>
            <span class="badge badge--primary">${counts.all - counts.completed} pending</span>
          </div>
          <div class="search-box">
            <span class="search-box__icon">${ICONS.search}</span>
            <input type="search" id="localSearch" class="search-box__input" placeholder="Search tasks..." value="${Tasks.escapeHTML(f.search)}">
          </div>
          <select class="select-inline" id="sortSelect" aria-label="Sort by">
            <option value="duedate" ${f.sort === 'duedate' ? 'selected' : ''}>Sort: Due Date</option>
            <option value="priority" ${f.sort === 'priority' ? 'selected' : ''}>Sort: Priority</option>
            <option value="created" ${f.sort === 'created' ? 'selected' : ''}>Sort: Recently added</option>
            <option value="title" ${f.sort === 'title' ? 'selected' : ''}>Sort: Title</option>
          </select>
          <div class="view-toggle" role="group" aria-label="View mode">
            <button data-viewmode="list" class="${f.view === 'list' ? 'active' : ''}" aria-label="List view">${ICONS.list}</button>
            <button data-viewmode="cards" class="${f.view === 'cards' ? 'active' : ''}" aria-label="Cards view">${ICONS.grid}</button>
          </div>
        </div>

        <div class="toolbar">
          <div class="chips">
            ${chip('all', 'All')}
            ${chip('todo', 'To Do')}
            ${chip('inprogress', 'In Progress')}
            ${chip('completed', 'Completed')}
          </div>
          <span style="flex:1"></span>
          <div class="chips-tags">
            <span class="chips-label">PRIORITY</span>
            <select class="select-inline" id="priorityFilter" aria-label="Filter by priority">
              <option value="all" ${f.priority === 'all' ? 'selected' : ''}>All</option>
              <option value="low" ${f.priority === 'low' ? 'selected' : ''}>Low</option>
              <option value="medium" ${f.priority === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="high" ${f.priority === 'high' ? 'selected' : ''}>High</option>
            </select>
            <span class="chips-label">CATEGORY</span>
            <select class="select-inline" id="categoryFilter" aria-label="Filter by category">
              <option value="all" ${f.category === 'all' ? 'selected' : ''}>All</option>
              ${cats.map((c) => `<option value="${c.id}" ${f.category === c.id ? 'selected' : ''}>${Tasks.escapeHTML(c.name)}</option>`).join('')}
            </select>
          </div>
        </div>

        ${Tasks.renderList(filtered, { emptyTitle: 'No tasks found', emptyText: 'Try adjusting filters or create a new task.' })}`;
    },

    today() {
      const open = Tasks.all().filter((t) => t.status !== 'completed');
      const overdue = open.filter(Tasks.isOverdue);
      const dueToday = open.filter((t) => Tasks.isToday(t));
      const total = overdue.length + dueToday.length;
      const doneToday = Tasks.all().filter(
        (t) => t.status === 'completed' && t.completedAt === Tasks.todayISO()
      ).length;
      const pct = total ? Math.round((doneToday / (total + doneToday)) * 100) : (total ? 0 : 100);

      return `
        <div class="panel" style="margin-bottom:16px">
          <div class="view-head" style="margin-bottom:10px">
            <div>
              <h2 style="font-size:15px">Daily Progress</h2>
              <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
            <span class="badge badge--primary">${pct}% complete</span>
          </div>
          <div class="progress" style="height:9px">
            <span class="progress__bar ${pct >= 100 ? 'progress__bar--success' : ''}" style="width:${pct}%"></span>
          </div>
          <p class="stat-note" style="margin-top:8px">${doneToday} completed today · ${total} remaining</p>
        </div>

        ${overdue.length ? `
          <h4 class="group-title"><span class="badge badge--danger">${overdue.length} overdue</span> Overdue</h4>
          ${Tasks.renderList(overdue, { emptyTitle: '', emptyText: '' })}` : ''}
        <h4 class="group-title"><span class="badge badge--primary">${dueToday.length}</span> Due Today</h4>
        ${Tasks.renderList(dueToday, { emptyTitle: 'Nothing due today', emptyText: 'Enjoy the free day or check upcoming tasks.' })}`;
    },

    upcoming() {
      const open = Tasks.all().filter(
        (t) => t.status !== 'completed' && t.dueDate && Tasks.daysBetween(t.dueDate) > 0
      );
      const groups = { 'Tomorrow': [], 'This Week': [], 'Later': [] };
      open.forEach((t) => {
        const d = Tasks.daysBetween(t.dueDate);
        if (d === 1) groups['Tomorrow'].push(t);
        else if (d <= 7) groups['This Week'].push(t);
        else groups['Later'].push(t);
      });

      const html = Object.entries(groups)
        .filter(([, list]) => list.length)
        .map(([label, list]) => `
          <h4 class="group-title">${label} <span class="group-count">${list.length}</span></h4>
          ${Tasks.renderList(list)}`)
        .join('');

      return html || Tasks.emptyState('No upcoming tasks', 'Tasks with future due dates will appear here.');
    },

    completed() {
      const done = Tasks.all()
        .filter((t) => t.status === 'completed')
        .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
      return `
        <div class="toolbar">
          <div class="toolbar__title">
            <h3>${ICONS['check-circle']} History</h3>
            <span class="badge badge--success">${done.length} completed</span>
          </div>
        </div>
        ${Tasks.renderList(done, { emptyTitle: 'No completed tasks', emptyText: 'Completed tasks will show up here with their completion date.' })}`;
    },

    categories() {
      const cats = Storage.getCategories();
      const tasks = Tasks.all();
      return `
        <div class="view-head">
          <div>
            <h2>Categories</h2>
            <p>Organize your tasks by area of work.</p>
          </div>
          <button class="btn btn--primary" data-action="new-category">${ICONS.plusSm} New Category</button>
        </div>

        <div class="panel" id="categoryFormPanel" hidden style="margin-bottom:16px">
          <div class="field" style="margin-bottom:10px">
            <label class="field__label" for="catNameInput">Category Name</label>
            <input class="input" id="catNameInput" maxlength="24" placeholder="e.g. Marketing">
          </div>
          <div class="field" style="margin-bottom:14px">
            <span class="field__label">Color</span>
            <div class="color-options" id="catColorOptions">
              ${['#7C5CFC', '#2ECC71', '#F4B740', '#F16C6C', '#4BA3F4', '#F07CB4'].map((c, i) =>
                `<button type="button" class="color-option ${i === 0 ? 'selected' : ''}" style="background:${c}" data-color="${c}" aria-label="Color ${c}"></button>`).join('')}
            </div>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="btn btn--ghost" data-action="cancel-category">Cancel</button>
            <button class="btn btn--primary" data-action="save-category">${ICONS.plusSm} Create Category</button>
          </div>
        </div>

        <div class="cat-grid">
          ${cats.map((c) => {
            const all = tasks.filter((t) => t.category === c.id);
            const open = all.filter((t) => t.status !== 'completed').length;
            const pct = all.length ? Math.round(((all.length - open) / all.length) * 100) : 0;
            return `
            <div class="cat-card" data-id="${c.id}">
              <div class="cat-card__head">
                <span class="cat-card__name"><span class="cat-dot" style="background:${c.color}"></span>${Tasks.escapeHTML(c.name)}</span>
                <span class="cat-card__actions">
                  <button class="task-action" data-action="edit-category" data-id="${c.id}" aria-label="Edit category">${ICONS.pencil}</button>
                  <button class="task-action task-action--danger" data-action="delete-category" data-id="${c.id}" aria-label="Delete category">${ICONS.trash}</button>
                </span>
              </div>
              <div class="progress"><span class="progress__bar" style="width:${pct}%"></span></div>
              <div class="cat-card__footer">
                <span>${all.length} task${all.length === 1 ? '' : 's'} · ${open} open</span>
                <button class="btn btn--ghost btn--sm" data-action="filter-cat" data-id="${c.id}">View tasks</button>
              </div>
            </div>`;
          }).join('')}
        </div>
        ${cats.length === 0 ? Tasks.emptyState('No categories', 'Create your first category to organize tasks.') : ''}`;
    },

    profile() {
      const p = Storage.getProfile();
      const tasks = Tasks.all();
      const done = tasks.filter((t) => t.status === 'completed').length;
      return `
        <div class="profile-card">
          <div class="profile-head">
            <span class="avatar" id="profileAvatar">${initials(p.name)}</span>
            <div>
              <h3>${Tasks.escapeHTML(p.name)}</h3>
              <p>${Tasks.escapeHTML(p.role)}</p>
            </div>
          </div>
          <div class="stats-grid" style="margin-bottom:22px;grid-template-columns:repeat(2,1fr)">
            ${statCard('Total Tasks', tasks.length, ICONS.tasks, 'primary', '')}
            ${statCard('Completed', done, ICONS['check-circle'], 'success', '')}
          </div>
          <div class="field">
            <label class="field__label" for="profileName">Name</label>
            <input class="input" id="profileName" value="${Tasks.escapeHTML(p.name)}" maxlength="40">
          </div>
          <div class="field">
            <label class="field__label" for="profileEmail">E-mail</label>
            <input class="input" id="profileEmail" type="email" value="${Tasks.escapeHTML(p.email)}" maxlength="60">
          </div>
          <div class="field">
            <label class="field__label" for="profileRole">Role</label>
            <input class="input" id="profileRole" value="${Tasks.escapeHTML(p.role)}" maxlength="40">
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">
            <button class="btn btn--primary" data-action="save-profile">${ICONS.check} Save Changes</button>
          </div>
        </div>`;
    },

    settings() {
      const prefs = Storage.getPrefs();
      const t = Theme.get();
      return `
        <div class="settings-card">
          <h3>Appearance</h3>
          <p>Choose the theme for the interface.</p>
          <div class="theme-cards">
            <button class="theme-card ${t === 'dark' ? 'active' : ''}" data-theme="dark" data-action="set-theme">
              <span class="theme-preview theme-preview--dark"><span></span><span></span><span></span></span>
              <span class="theme-card__label">${ICONS.moon} Dark Mode</span>
            </button>
            <button class="theme-card ${t === 'light' ? 'active' : ''}" data-theme="light" data-action="set-theme">
              <span class="theme-preview theme-preview--light"><span></span><span></span><span></span></span>
              <span class="theme-card__label">${ICONS.sun} Light Mode</span>
            </button>
          </div>
        </div>

        <div class="settings-card">
          <h3>Preferences</h3>
          <p>Default behavior for task views.</p>
          <div class="setting-row">
            <div class="setting-row__info">
              <strong>Default view mode</strong>
              <span>How task lists are displayed.</span>
            </div>
            <select class="select-inline" id="prefViewMode" aria-label="Default view mode">
              <option value="list" ${prefs.viewMode === 'list' ? 'selected' : ''}>List</option>
              <option value="cards" ${prefs.viewMode === 'cards' ? 'selected' : ''}>Cards</option>
            </select>
          </div>
          <div class="setting-row">
            <div class="setting-row__info">
              <strong>Notifications</strong>
              <span>Show toast notifications for actions.</span>
            </div>
            <button class="switch ${prefs.notifications ? 'on' : ''}" id="prefNotifications" role="switch"
              aria-checked="${prefs.notifications}" aria-label="Toggle notifications" data-action="toggle-notif-pref"></button>
          </div>
        </div>`;
    }
  };

  /* ================= PER-VIEW EVENT WIRING ================= */
  const wireView = (content) => {
    // local search (My Tasks)
    const local = content.querySelector('#localSearch');
    if (local) {
      local.addEventListener('input', () => {
        Filters.state.search = local.value;
        const input = document.getElementById('globalSearch');
        if (input) input.value = local.value;
        rerenderView();
        const again = document.getElementById('localSearch');
        if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
      });
    }
    const sort = content.querySelector('#sortSelect');
    if (sort) sort.addEventListener('change', () => { Filters.state.sort = sort.value; rerenderView(); });

    const prio = content.querySelector('#priorityFilter');
    if (prio) prio.addEventListener('change', () => { Filters.state.priority = prio.value; rerenderView(); });

    const catf = content.querySelector('#categoryFilter');
    if (catf) catf.addEventListener('change', () => { Filters.state.category = catf.value; rerenderView(); });

    const vm = content.querySelector('#prefViewMode');
    if (vm) vm.addEventListener('change', () => {
      const prefs = Storage.getPrefs();
      prefs.viewMode = vm.value;
      Storage.savePrefs(prefs);
      Filters.state.view = vm.value;
      Tasks.toast('Preference saved', 'success');
    });

    const notifSwitch = content.querySelector('#prefNotifications');
    if (notifSwitch) notifSwitch.addEventListener('click', () => {
      const prefs = Storage.getPrefs();
      prefs.notifications = !prefs.notifications;
      Storage.savePrefs(prefs);
      notifSwitch.classList.toggle('on', prefs.notifications);
      notifSwitch.setAttribute('aria-checked', prefs.notifications);
    });

    const catName = content.querySelector('#catNameInput');
    if (catName) catName.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveCategoryForm(); });
  };

  const rerenderView = () => {
    const content = document.getElementById('appContent');
    content.innerHTML = RENDERERS[currentView]({});
    wireView(content);
  };

  /* ---------- category form state ---------- */
  let editingCategoryId = null;

  const openCategoryForm = (catId = null) => {
    const panel = document.getElementById('categoryFormPanel');
    if (!panel) return;
    editingCategoryId = catId;
    panel.hidden = false;
    const input = panel.querySelector('#catNameInput');
    const btn = panel.querySelector('[data-action="save-category"]');
    if (catId) {
      const cat = Storage.getCategories().find((c) => c.id === catId);
      input.value = cat ? cat.name : '';
      btn.innerHTML = `${ICONS.check} Save Changes`;
      selectColor(cat ? cat.color : null);
    } else {
      input.value = '';
      btn.innerHTML = `${ICONS.plusSm} Create Category`;
      selectColor('#7C5CFC');
    }
    setTimeout(() => input.focus(), 30);
  };

  const selectedColor = () => {
    const el = document.querySelector('#catColorOptions .color-option.selected');
    return el ? el.dataset.color : '#7C5CFC';
  };

  const selectColor = (color) => {
    document.querySelectorAll('#catColorOptions .color-option').forEach((b) => {
      b.classList.toggle('selected', !!color && b.dataset.color === color);
    });
  };

  const saveCategoryForm = () => {
    const input = document.getElementById('catNameInput');
    const name = input.value.trim();
    if (!name) { input.focus(); Tasks.toast('Category name is required', 'warning'); return; }
    if (editingCategoryId) {
      Tasks.updateCategory(editingCategoryId, name, selectedColor());
      Tasks.toast('Category updated', 'success');
    } else {
      Tasks.createCategory(name, selectedColor());
      Tasks.toast('Category created', 'success');
    }
    editingCategoryId = null;
    App.refresh();
  };

  /* ================= NOTIFICATIONS PANEL ================= */
  const toggleNotifPanel = () => {
    const panel = document.getElementById('notifPanel');
    if (!panel.hidden) { panel.hidden = true; return; }
    const open = Tasks.all().filter((t) => t.status !== 'completed');
    const urgent = open.filter((t) => Tasks.isToday(t) || Tasks.isOverdue(t));
    panel.innerHTML = `
      <div class="notif-panel__title">Needs attention · ${urgent.length}</div>
      ${urgent.length
        ? urgent.slice(0, 6).map((t) => {
            const d = Tasks.daysBetween(t.dueDate);
            return `<div class="notif-item" data-nav="mytasks" data-filter="today">
              <span class="cat-dot" style="margin-top:6px;background:${(Tasks.categoryOf(t) || {}).color || 'var(--primary)'}"></span>
              <span>
                <span class="notif-item__title">${Tasks.escapeHTML(t.title)}</span><br>
                <span class="notif-item__meta">${d < 0 ? 'Overdue' : 'Due today'} · ${Tasks.PRIORITY_META[t.priority].label} priority</span>
              </span>
            </div>`;
          }).join('')
        : '<div class="notif-empty">Nothing urgent. You are all caught up!</div>'}`;
    panel.hidden = false;
  };

  /* ================= GLOBAL EVENTS ================= */
  const bindGlobal = () => {
    // sidebar navigation
    document.getElementById('sidebarNav').addEventListener('click', (e) => {
      const nav = e.target.closest('.nav-item');
      if (!nav) return;
      e.preventDefault();
      navigate(nav.dataset.view);
      closeDrawer();
    });

    document.getElementById('navCategories').addEventListener('click', (e) => {
      const cat = e.target.closest('.nav-cat');
      if (!cat) return;
      e.preventDefault();
      Filters.state.category = cat.dataset.id;
      Filters.state.status = 'all';
      navigate('mytasks');
      closeDrawer();
    });

    // global delegated actions
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-action], [data-nav], [data-chip], [data-viewmode], [data-color]');
      if (!el) return;

      // close notif panel on any other click
      if (!e.target.closest('#notifPanel') && !e.target.closest('#btnNotifications')) {
        document.getElementById('notifPanel').hidden = true;
      }

      const act = el.dataset.action;

      if (el.dataset.color) { selectColor(el.dataset.color); return; }

      if (act === 'open-create') { Tasks.openModal(null); return; }
      if (act === 'close-modal') { Tasks.closeModal(); return; }
      if (act === 'submit-task') { Tasks.submitModal(); return; }
      if (act === 'modal-delete') { Tasks.modalDelete(); return; }
      if (act === 'goto-profile') { navigate('profile'); closeDrawer(); return; }
      if (act === 'goto-categories') { Filters.state.category = 'all'; navigate('categories'); return; }
      if (act === 'toggle-notifications') { toggleNotifPanel(); return; }

      if (act === 'toggle-task') { Tasks.toggleComplete(el.dataset.id); return; }
      if (act === 'edit-task') { Tasks.openModal(el.dataset.id); return; }
      if (act === 'delete-task') { Tasks.deleteTask(el.dataset.id); return; }

      if (act === 'set-theme') { Theme.set(el.dataset.theme); rerenderView(); return; }

      if (act === 'new-category') { openCategoryForm(null); return; }
      if (act === 'edit-category') { openCategoryForm(el.dataset.id); return; }
      if (act === 'cancel-category') {
        editingCategoryId = null;
        const panel = document.getElementById('categoryFormPanel');
        if (panel) panel.hidden = true;
        return;
      }
      if (act === 'save-category') { saveCategoryForm(); return; }
      if (act === 'delete-category') {
        if (Tasks.deleteCategory(el.dataset.id)) App.refresh();
        return;
      }
      if (act === 'filter-cat') {
        Filters.state.category = el.dataset.id;
        Filters.state.status = 'all';
        navigate('mytasks');
        return;
      }
      if (act === 'save-profile') {
        const name = document.getElementById('profileName').value.trim();
        const email = document.getElementById('profileEmail').value.trim();
        const role = document.getElementById('profileRole').value.trim();
        if (!name) { Tasks.toast('Name is required', 'warning'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { Tasks.toast('Enter a valid e-mail', 'warning'); return; }
        Storage.saveProfile({ name, email, role });
        syncProfile();
        Tasks.toast('Profile updated', 'success');
        return;
      }

      if (el.dataset.chip) {
        Filters.state.status = el.dataset.chip;
        rerenderView();
        return;
      }
      if (el.dataset.viewmode) {
        Filters.state.view = el.dataset.viewmode;
        const prefs = Storage.getPrefs();
        prefs.viewMode = Filters.state.view;
        Storage.savePrefs(prefs);
        rerenderView();
        return;
      }
      if (el.dataset.nav) {
        if (el.dataset.filter === 'today') {
          document.getElementById('notifPanel').hidden = true;
          navigate('today');
          return;
        }
        navigate(el.dataset.nav);
        document.getElementById('notifPanel').hidden = true;
        return;
      }
    });

    // modal: status segmented control
    document.getElementById('taskStatusGroup').addEventListener('click', (e) => {
      const btn = e.target.closest('.segmented__btn');
      if (!btn) return;
      Tasks.setModalStatus(btn.dataset.status);
    });

    // modal overlay click-outside
    document.getElementById('taskModal').addEventListener('click', (e) => {
      if (e.target.id === 'taskModal') Tasks.closeModal();
    });

    // global search
    const gs = document.getElementById('globalSearch');
    gs.addEventListener('input', () => {
      Filters.state.search = gs.value;
      if (currentView !== 'mytasks') navigate('mytasks');
      else rerenderView();
    });

    // notifications button already covered by data-action

    // mobile drawer
    document.getElementById('btnMenu').addEventListener('click', () => {
      document.getElementById('sidebar').classList.add('open');
      document.getElementById('sidebarOverlay').classList.add('show');
    });
    document.getElementById('sidebarOverlay').addEventListener('click', closeDrawer);

    // keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('globalSearch').focus();
      }
      if (e.key === 'Escape') {
        Tasks.closeModal();
        document.getElementById('notifPanel').hidden = true;
        closeDrawer();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!document.getElementById('taskModal').hidden) Tasks.submitModal();
      }
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        document.getElementById('globalSearch').focus();
      }
    });
  };

  const closeDrawer = () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
  };

  /* ---------- init ---------- */
  const injectStaticIcons = () => {
    document.querySelectorAll('[data-icon]').forEach((el) => {
      el.innerHTML = window.ICONS[el.dataset.icon] || '';
    });
  };

  const init = () => {
    Storage.init();
    Theme.init();

    injectStaticIcons();

    // respect saved default view mode
    Filters.state.view = Storage.getPrefs().viewMode || 'list';

    syncSidebar();
    syncProfile();
    bindGlobal();

    const start = (location.hash || '#dashboard').slice(1);
    navigate(VIEWS[start] ? start : 'dashboard');

    window.addEventListener('hashchange', () => {
      const v = location.hash.slice(1);
      if (VIEWS[v] && v !== currentView) navigate(v);
    });
  };

  document.addEventListener('DOMContentLoaded', init);

  return { navigate, refresh, rerenderView };
})();
