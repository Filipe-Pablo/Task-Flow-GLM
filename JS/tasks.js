/* ============ TASKFLOW — TASKS (CRUD, rendering, modal, toasts) ============ */

const Tasks = (() => {
  const PRIORITY_META = {
    low:    { label: 'Low',    badge: 'success' },
    medium: { label: 'Medium', badge: 'warning' },
    high:   { label: 'High',   badge: 'danger' }
  };

  const STATUS_META = {
    todo:       { label: 'To Do',       badge: 'neutral' },
    inprogress: { label: 'In Progress', badge: 'primary' },
    completed:  { label: 'Completed',   badge: 'success' }
  };

  /* ---------- date helpers ---------- */
  const todayISO = () => {
    const d = new Date();
    return (
      d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0')
    );
  };

  const daysBetween = (iso, base) => {
    if (!iso) return null;
    const a = new Date(iso + 'T12:00:00');
    const b = new Date((base || todayISO()) + 'T12:00:00');
    return Math.round((a - b) / 86400000);
  };

  const isToday = (t) => daysBetween(t.dueDate) === 0;
  const isOverdue = (t) =>
    t.status !== 'completed' && t.dueDate && daysBetween(t.dueDate) < 0;

  const formatLong = (iso) =>
    new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });

  const formatShort = (iso) =>
    new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    });

  const dueLabel = (t) => {
    if (!t.dueDate) return { text: 'No date', cls: '' };
    const d = daysBetween(t.dueDate);
    if (t.status === 'completed')
      return { text: 'Done', cls: 'due-chip--done' };
    if (d === 0) return { text: 'Today', cls: 'due-chip--today' };
    if (d === 1) return { text: 'Tomorrow', cls: 'due-chip--today' };
    if (d === -1) return { text: 'Yesterday', cls: 'due-chip--overdue' };
    if (d < -1) return { text: `${formatShort(t.dueDate)} · Overdue`, cls: 'due-chip--overdue' };
    return { text: d <= 7 ? formatShort(t.dueDate) : formatShort(t.dueDate), cls: '' };
  };

  const categoryOf = (t) =>
    Storage.getCategories().find((c) => c.id === t.category) || null;

  /* ---------- CRUD ---------- */
  const all = () => Storage.getTasks();
  const getById = (id) => all().find((t) => t.id === id) || null;

  const commit = (tasks) => Storage.saveTasks(tasks);

  const createTask = (data) => {
    const tasks = all();
    tasks.push({
      id: Storage.uid('task'),
      title: data.title.trim(),
      description: (data.description || '').trim(),
      dueDate: data.dueDate || '',
      createdAt: todayISO(),
      completedAt: data.status === 'completed' ? todayISO() : null,
      priority: data.priority,
      category: data.category,
      status: data.status
    });
    commit(tasks);
  };

  const updateTask = (id, data) => {
    const tasks = all();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const prev = tasks[idx];
    tasks[idx] = {
      ...prev,
      title: data.title.trim(),
      description: (data.description || '').trim(),
      dueDate: data.dueDate || '',
      priority: data.priority,
      category: data.category,
      status: data.status,
      completedAt:
        data.status === 'completed' ? (prev.completedAt || todayISO()) : null
    };
    commit(tasks);
  };

  /* DELETE — immediate, no confirmation, no modal */
  const deleteTask = (id) => {
    commit(all().filter((t) => t.id !== id));
    if (typeof App !== 'undefined') App.refresh();
    Tasks.toast('Task deleted', 'danger');
  };

  /* toggle complete / reopen (undo map kept in memory, not persisted) */
  const prevStatusMap = new Map();

  const toggleComplete = (id) => {
    const tasks = all();
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    if (t.status === 'completed') {
      t.status = prevStatusMap.get(id) || 'todo';
      t.completedAt = null;
      prevStatusMap.delete(id);
      commit(tasks);
      App.refresh();
      Tasks.toast('Task reopened', 'info');
    } else {
      prevStatusMap.set(id, t.status);
      t.status = 'completed';
      t.completedAt = todayISO();
      commit(tasks);
      App.refresh();
      Tasks.toast('Task marked as completed!', 'success', {
        label: 'Undo',
        run: () => toggleComplete(id)
      });
    }
  };

  /* ---------- badge/label rendering ---------- */
  const badge = (text, variant) =>
    `<span class="badge badge--${variant}">${text}</span>`;

  const priorityBadge = (t) => {
    const m = PRIORITY_META[t.priority] || PRIORITY_META.low;
    return badge(`<span class="badge-dot"></span>${m.label} Priority`, m.badge);
  };

  const statusBadge = (t) => {
    const m = STATUS_META[t.status] || STATUS_META.todo;
    return badge(`<span class="badge-dot"></span>${m.label}`, m.badge);
  };

  const categoryBadge = (t) => {
    const cat = categoryOf(t);
    if (!cat) return '';
    return `<span class="badge badge--neutral"><span class="badge-dot" style="background:${cat.color}"></span>${cat.name}</span>`;
  };

  /* ---------- row / card rendering ---------- */
  const rowTemplate = (t, icons) => {
    const due = dueLabel(t);
    const cat = categoryOf(t);
    const done = t.status === 'completed';
    const completedOn = done && t.completedAt ? formatShort(t.completedAt) : null;

    return `
      <article class="task-row ${done ? 'is-completed' : ''}" data-id="${t.id}">
        <button class="task-check ${done ? 'checked' : ''}" data-action="toggle-task" data-id="${t.id}"
                aria-label="${done ? 'Reopen task' : 'Mark as completed'}" aria-pressed="${done}">
          ${icons.check}
        </button>
        <div class="task-row__main">
          <div class="task-row__title-line">
            <span class="task-row__title">${escapeHTML(t.title)}</span>
            ${priorityBadge(t)}
            ${cat ? categoryBadge(t) : ''}
            ${statusBadge(t)}
          </div>
          ${t.description ? `<p class="task-row__desc">${escapeHTML(t.description)}</p>` : ''}
        </div>
        <div class="task-row__side">
          <span class="due-chip ${due.cls}">
            ${done && completedOn
              ? `${icons.history} ${completedOn}`
              : `${icons.calendar} ${due.text}`}
          </span>
          <button class="task-action" data-action="edit-task" data-id="${t.id}" aria-label="Edit task">${icons.pencil}</button>
          ${done
            ? `<button class="task-action task-action--success" data-action="toggle-task" data-id="${t.id}" aria-label="Reopen task">${icons.reopen}</button>`
            : ''}
          <button class="task-action task-action--danger" data-action="delete-task" data-id="${t.id}" aria-label="Delete task">${icons.trash}</button>
        </div>
      </article>`;
  };

  const cardTemplate = (t, icons) => {
    const due = dueLabel(t);
    const done = t.status === 'completed';
    return `
      <article class="task-card ${done ? 'is-completed' : ''}" data-id="${t.id}">
        <div class="task-card__top">
          <span class="task-card__title">${escapeHTML(t.title)}</span>
          <button class="task-check ${done ? 'checked' : ''}" data-action="toggle-task" data-id="${t.id}" aria-label="Toggle complete">${icons.check}</button>
        </div>
        ${t.description ? `<p class="task-card__desc">${escapeHTML(t.description)}</p>` : '<p class="task-card__desc"></p>'}
        <div class="task-card__badges">
          ${priorityBadge(t)}
          ${categoryBadge(t)}
          ${statusBadge(t)}
        </div>
        <div class="task-card__footer">
          <span class="due-chip ${due.cls}">${icons.calendar} ${due.text}</span>
          <span class="task-row__side">
            <button class="task-action" data-action="edit-task" data-id="${t.id}" aria-label="Edit task">${icons.pencil}</button>
            ${done ? `<button class="task-action task-action--success" data-action="toggle-task" data-id="${t.id}" aria-label="Reopen">${icons.reopen}</button>` : ''}
            <button class="task-action task-action--danger" data-action="delete-task" data-id="${t.id}" aria-label="Delete task">${icons.trash}</button>
          </span>
        </div>
      </article>`;
  };

  const renderList = (tasks, opts = {}) => {
    const icons = window.ICONS;
    if (!tasks.length) {
      return emptyState(opts.emptyTitle || 'No tasks found', opts.emptyText || 'Create a new task to get started.');
    }
    const mode = opts.mode || Filters.state.view;
    if (mode === 'cards') {
      return `<div class="task-grid">${tasks.map((t) => cardTemplate(t, icons)).join('')}</div>`;
    }
    return `<div class="task-list">${tasks.map((t) => rowTemplate(t, icons)).join('')}</div>`;
  };

  const emptyState = (title, text) => `
    <div class="empty-state">
      <span class="empty-icon">${window.ICONS.inbox}</span>
      <h3>${title}</h3>
      <p>${text}</p>
    </div>`;

  const escapeHTML = (s) =>
    String(s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);

  /* ---------- MODAL (Create & Update share it) ---------- */
  let modalStatus = 'todo';
  let editingId = null;

  const openModal = (taskId = null) => {
    const overlay = document.getElementById('taskModal');
    const ok = fillModal(taskId);
    if (!ok) return;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('taskTitle').focus(), 30);
  };

  const setModalStatus = (status) => {
    if (!['todo', 'inprogress', 'completed'].includes(status)) return;
    modalStatus = status;
    syncStatusGroup();
  };

  const fillModal = (taskId) => {
    editingId = taskId;
    const task = taskId ? getById(taskId) : null;
    if (taskId && !task) return false;

    document.getElementById('taskModalTitle').textContent =
      task ? 'Edit Task' : 'New Task';
    document.getElementById('taskTitle').value = task ? task.title : '';
    document.getElementById('taskDesc').value = task ? task.description : '';
    document.getElementById('taskDue').value = task ? task.dueDate || '' : todayISO();
    document.getElementById('taskPriority').value = task ? task.priority : 'medium';
    fillCategorySelect(task ? task.category : null);

    modalStatus = task ? task.status : 'todo';
    syncStatusGroup();

    document.getElementById('taskModalMeta').textContent = task
      ? `Created ${formatShort(task.createdAt || todayISO())}`
      : '';

    const delBtn = document.getElementById('btnModalDelete');
    delBtn.hidden = !task;

    const submit = document.getElementById('btnModalSubmit');
    submit.innerHTML = `${window.ICONS.plusSm} ${task ? 'Save Changes' : 'Create Task'}`;

    clearTitleError();
    return true;
  };

  const fillCategorySelect = (selected) => {
    const sel = document.getElementById('taskCategory');
    sel.innerHTML = Storage.getCategories()
      .map((c) => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${escapeHTML(c.name)}</option>`)
      .join('');
    if (!selected && sel.options.length) sel.selectedIndex = 0;
  };

  const syncStatusGroup = () => {
    document.querySelectorAll('#taskStatusGroup .segmented__btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.status === modalStatus);
    });
  };

  const closeModal = () => {
    document.getElementById('taskModal').hidden = true;
    document.body.style.overflow = '';
    editingId = null;
  };

  const clearTitleError = () => {
    document.getElementById('taskTitle').classList.remove('invalid');
    document.getElementById('taskTitleError').hidden = true;
  };

  const submitModal = () => {
    const titleEl = document.getElementById('taskTitle');
    const title = titleEl.value.trim();

    if (!title) {
      titleEl.classList.add('invalid');
      document.getElementById('taskTitleError').hidden = false;
      titleEl.focus();
      return;
    }

    const data = {
      title,
      description: document.getElementById('taskDesc').value,
      dueDate: document.getElementById('taskDue').value,
      priority: document.getElementById('taskPriority').value,
      category: document.getElementById('taskCategory').value,
      status: modalStatus
    };

    if (editingId) {
      updateTask(editingId, data);
      Tasks.toast('Changes saved successfully', 'success');
    } else {
      createTask(data);
      Tasks.toast('Task created successfully', 'success');
    }
    closeModal();
    if (typeof App !== 'undefined') App.refresh();
  };

  const modalDelete = () => {
    if (!editingId) return;
    const id = editingId;
    closeModal();
    deleteTask(id);
  };

  /* ---------- CATEGORIES CRUD ---------- */
  const createCategory = (name, color) => {
    const cats = Storage.getCategories();
    cats.push({ id: Storage.uid('cat'), name: name.trim(), color });
    Storage.saveCategories(cats);
  };

  const updateCategory = (id, name, color) => {
    const cats = Storage.getCategories();
    const c = cats.find((x) => x.id === id);
    if (c) { c.name = name.trim(); c.color = color; Storage.saveCategories(cats); }
  };

  const deleteCategory = (id) => {
    const tasks = all();
    const inUse = tasks.some((t) => t.category === id);
    if (inUse) {
      Tasks.toast('Cannot delete: category has tasks assigned', 'warning');
      return false;
    }
    Storage.saveCategories(Storage.getCategories().filter((c) => c.id !== id));
    Tasks.toast('Category deleted', 'danger');
    return true;
  };

  /* ---------- TOASTS ---------- */
  const toast = (msg, type = 'info', action = null) => {
    if (!Storage.getPrefs().notifications && type !== 'danger') return;
    const wrap = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.innerHTML = `
      <span class="toast__icon">${window.ICONS[type === 'danger' ? 'alert' : type === 'warning' ? 'alert' : type === 'success' ? 'check-circle' : 'info']}</span>
      <span class="toast__msg">${escapeHTML(msg)}</span>
      ${action ? `<button class="toast__action" type="button">${escapeHTML(action.label)}</button>` : ''}
      <button class="toast__close" type="button" aria-label="Dismiss">${window.ICONS.x}</button>`;
    const dismiss = () => {
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 200);
    };
    el.querySelector('.toast__close').addEventListener('click', dismiss);
    if (action) {
      el.querySelector('.toast__action').addEventListener('click', () => {
        action.run();
        dismiss();
      });
    }
    wrap.appendChild(el);
    setTimeout(dismiss, 5000);
  };

  return {
    PRIORITY_META, STATUS_META,
    all, getById, createTask, updateTask, deleteTask, toggleComplete,
    isToday, isOverdue, daysBetween, todayISO, formatLong, formatShort, dueLabel,
    categoryOf, priorityBadge, statusBadge, categoryBadge,
    renderList, emptyState, escapeHTML,
    openModal, closeModal, submitModal, modalDelete, clearTitleError, setModalStatus,
    createCategory, updateCategory, deleteCategory,
    toast
  };
})();
