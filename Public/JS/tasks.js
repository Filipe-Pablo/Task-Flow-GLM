/* ============ TASKFLOW — TASKS (Firestore CRUD, rendering, modal, toasts) ============ */
import { TaskService } from "./taskService.js";

const Tasks = (() => {
  let tasksList = [];
  let isLoadingTasks = true;
  let loadError = null;
  let unsubscribeTasks = null;

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
  const toLocalISO = (d) =>
    d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');

  const todayISO = () => toLocalISO(new Date());

  const daysBetween = (iso, base) => {
    if (!iso) return null;
    const clean = typeof iso === 'string' && iso.includes('T') ? iso.split('T')[0] : String(iso);
    const a = new Date(clean + 'T12:00:00');
    const b = new Date((base || todayISO()) + 'T12:00:00');
    return Math.round((a - b) / 86400000);
  };

  const isToday = (t) => daysBetween(t.dueDate) === 0;
  const isOverdue = (t) =>
    t.status !== 'completed' && t.dueDate && daysBetween(t.dueDate) < 0;

  const formatLong = (iso) => {
    if (!iso) return '';
    const clean = typeof iso === 'string' && iso.includes('T') ? iso.split('T')[0] : String(iso);
    return new Date(clean + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });
  };

  const formatShort = (iso) => {
    if (!iso) return '';
    const clean = typeof iso === 'string' && iso.includes('T') ? iso.split('T')[0] : String(iso);
    return new Date(clean + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    });
  };

  const dueLabel = (t) => {
    if (!t.dueDate) return { text: 'No date', cls: '' };
    const d = daysBetween(t.dueDate);
    if (t.status === 'completed')
      return { text: 'Done', cls: 'due-chip--done' };
    if (d === 0) return { text: 'Today', cls: 'due-chip--today' };
    if (d === 1) return { text: 'Tomorrow', cls: 'due-chip--today' };
    if (d === -1) return { text: 'Yesterday', cls: 'due-chip--overdue' };
    if (d < -1) return { text: `${formatShort(t.dueDate)} · Overdue`, cls: 'due-chip--overdue' };
    return { text: formatShort(t.dueDate), cls: '' };
  };

  const categoryOf = (t) =>
    (typeof Storage !== 'undefined' ? Storage.getCategories() : []).find((c) => c.id === t.category) || null;

  /* ---------- Task normalization ---------- */
  const normalizeTask = (raw) => {
    let createdIso = todayISO();
    if (raw.createdAt) {
      if (typeof raw.createdAt.toDate === 'function') {
        createdIso = toLocalISO(raw.createdAt.toDate());
      } else if (typeof raw.createdAt === 'string') {
        createdIso = raw.createdAt.split('T')[0];
      } else if (raw.createdAt instanceof Date) {
        createdIso = toLocalISO(raw.createdAt);
      }
    }
    const isCompleted = raw.status === 'completed' || raw.completed === true;
    return {
      id: raw.id,
      title: raw.title || '',
      description: raw.description || '',
      dueDate: raw.dueDate || '',
      createdAt: createdIso,
      completedAt: raw.completedAt || (isCompleted ? createdIso : null),
      priority: raw.priority || 'medium',
      category: raw.category || '',
      status: isCompleted ? 'completed' : (raw.status || 'todo'),
      completed: isCompleted
    };
  };

  /* ---------- Initialization & Real-Time Sync ---------- */
  let initialLoadTimeout = null;

  const init = () => {
    if (unsubscribeTasks) return;
    isLoadingTasks = true;
    loadError = null;

    // Timeout de segurança: evita que o app fique travado em loading se o Firestore demorar
    if (initialLoadTimeout) clearTimeout(initialLoadTimeout);
    initialLoadTimeout = setTimeout(() => {
      if (isLoadingTasks) {
        isLoadingTasks = false;
        if (typeof App !== 'undefined' && typeof App.refresh === 'function') {
          App.refresh();
        }
      }
    }, 3000);

    unsubscribeTasks = TaskService.subscribeTasks(
      (docs) => {
        if (initialLoadTimeout) {
          clearTimeout(initialLoadTimeout);
          initialLoadTimeout = null;
        }
        tasksList = docs.map(normalizeTask);
        isLoadingTasks = false;
        loadError = null;
        if (typeof App !== 'undefined' && typeof App.refresh === 'function') {
          App.refresh();
        }
      },
      (error) => {
        if (initialLoadTimeout) {
          clearTimeout(initialLoadTimeout);
          initialLoadTimeout = null;
        }
        isLoadingTasks = false;
        loadError = error.message || 'Unable to connect to Firestore.';
        console.error('Task synchronization error:', error);
        if (typeof App !== 'undefined' && typeof App.refresh === 'function') {
          App.refresh();
        }
        toast('Firestore: ' + loadError, 'danger');
      }
    );
  };

  const retry = () => {
    if (unsubscribeTasks) {
      unsubscribeTasks();
      unsubscribeTasks = null;
    }
    init();
  };

  /* ---------- CRUD ---------- */
  const all = () => tasksList;
  const getById = (id) => tasksList.find((t) => t.id === id) || null;
  const isLoading = () => isLoadingTasks;
  const getError = () => loadError;

  const createTask = async (data) => {
    return await TaskService.createTask(data);
  };

  const updateTask = async (id, data) => {
    return await TaskService.updateTask(id, data);
  };

  /* DELETE — immediate, updates Firestore */
  const deleteTask = async (id) => {
    try {
      await TaskService.deleteTask(id);
      Tasks.toast('Task deleted', 'danger');
    } catch (err) {
      console.error('Failed to delete task:', err);
      Tasks.toast('Failed to delete task', 'danger');
    }
  };

  /* toggle complete / reopen */
  const prevStatusMap = new Map();

  const toggleComplete = async (id) => {
    const t = getById(id);
    if (!t) return;
    const isDone = t.status === 'completed' || t.completed === true;
    let nextStatus, nextCompleted, nextCompletedAt;
    if (isDone) {
      nextStatus = prevStatusMap.get(id) || 'todo';
      nextCompleted = false;
      nextCompletedAt = null;
      prevStatusMap.delete(id);
    } else {
      prevStatusMap.set(id, t.status);
      nextStatus = 'completed';
      nextCompleted = true;
      nextCompletedAt = todayISO();
    }

    try {
      await updateTask(id, {
        status: nextStatus,
        completed: nextCompleted,
        completedAt: nextCompletedAt
      });
      if (isDone) {
        Tasks.toast('Task reopened', 'info');
      } else {
        Tasks.toast('Task marked as completed!', 'success', {
          label: 'Undo',
          run: () => toggleComplete(id)
        });
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
      Tasks.toast('Failed to update task status', 'danger');
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
    const done = t.status === 'completed' || t.completed === true;
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
    const done = t.status === 'completed' || t.completed === true;
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
    const icons = window.ICONS || {};

    if (isLoadingTasks) {
      return loadingState();
    }

    if (loadError) {
      return errorState(loadError);
    }

    if (!tasks || !tasks.length) {
      return emptyState(opts.emptyTitle || 'No tasks found', opts.emptyText || 'Create a new task to get started.');
    }

    const mode = opts.mode || (typeof Filters !== 'undefined' ? Filters.state.view : 'list');
    if (mode === 'cards') {
      return `<div class="task-grid">${tasks.map((t) => cardTemplate(t, icons)).join('')}</div>`;
    }
    return `<div class="task-list">${tasks.map((t) => rowTemplate(t, icons)).join('')}</div>`;
  };

  const loadingState = () => `
    <div class="empty-state" role="status" aria-live="polite">
      <div class="loading-spinner"></div>
      <h3>Loading tasks...</h3>
      <p>Synchronizing with Firestore database...</p>
    </div>`;

  const errorState = (msg) => `
    <div class="empty-state" role="alert">
      <span class="empty-icon" style="color:var(--danger, #F16C6C)">${window.ICONS ? window.ICONS.alert : '⚠️'}</span>
      <h3>Failed to load tasks</h3>
      <p>${escapeHTML(msg || 'Error communicating with Firestore.')}</p>
      <button class="btn btn--ghost btn--sm" style="margin-top:12px" data-action="retry-fetch">Try again</button>
    </div>`;

  const emptyState = (title, text) => `
    <div class="empty-state">
      <span class="empty-icon">${(window.ICONS && window.ICONS.inbox) || ''}</span>
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
    submit.innerHTML = `${(window.ICONS && window.ICONS.plusSm) || '+'} ${task ? 'Save Changes' : 'Create Task'}`;

    clearTitleError();
    return true;
  };

  const fillCategorySelect = (selected) => {
    const sel = document.getElementById('taskCategory');
    if (!sel || typeof Storage === 'undefined') return;
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

  const submitModal = async () => {
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
      status: modalStatus,
      completed: modalStatus === 'completed',
      completedAt: modalStatus === 'completed' ? todayISO() : null
    };

    const submitBtn = document.getElementById('btnModalSubmit');
    if (submitBtn) submitBtn.disabled = true;

    try {
      if (editingId) {
        await updateTask(editingId, data);
        Tasks.toast('Changes saved successfully', 'success');
      } else {
        await createTask(data);
        Tasks.toast('Task created successfully', 'success');
      }
      closeModal();
      if (typeof App !== 'undefined' && typeof App.refresh === 'function') {
        App.refresh();
      }
    } catch (err) {
      console.error('Error submitting task:', err);
      Tasks.toast('Failed to save task: ' + (err.message || 'Firestore error'), 'danger');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  };

  const modalDelete = async () => {
    if (!editingId) return;
    const id = editingId;
    closeModal();
    await deleteTask(id);
  };

  /* ---------- CATEGORIES CRUD ---------- */
  const createCategory = (name, color) => {
    if (typeof Storage === 'undefined') return;
    const cats = Storage.getCategories();
    cats.push({ id: Storage.uid('cat'), name: name.trim(), color });
    Storage.saveCategories(cats);
  };

  const updateCategory = (id, name, color) => {
    if (typeof Storage === 'undefined') return;
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
    if (typeof Storage !== 'undefined') {
      Storage.saveCategories(Storage.getCategories().filter((c) => c.id !== id));
    }
    Tasks.toast('Category deleted', 'danger');
    return true;
  };

  /* ---------- TOASTS ---------- */
  const toast = (msg, type = 'info', action = null) => {
    if (typeof Storage !== 'undefined' && !Storage.getPrefs().notifications && type !== 'danger') return;
    const wrap = document.getElementById('toasts');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    const iconName = type === 'danger' ? 'alert' : type === 'warning' ? 'alert' : type === 'success' ? 'check-circle' : 'info';
    const iconHtml = (window.ICONS && window.ICONS[iconName]) || '';
    const closeIcon = (window.ICONS && window.ICONS.x) || '×';

    el.innerHTML = `
      <span class="toast__icon">${iconHtml}</span>
      <span class="toast__msg">${escapeHTML(msg)}</span>
      ${action ? `<button class="toast__action" type="button">${escapeHTML(action.label)}</button>` : ''}
      <button class="toast__close" type="button" aria-label="Dismiss">${closeIcon}</button>`;

    const dismiss = () => {
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 200);
    };

    const closeBtn = el.querySelector('.toast__close');
    if (closeBtn) closeBtn.addEventListener('click', dismiss);
    if (action) {
      const actBtn = el.querySelector('.toast__action');
      if (actBtn) {
        actBtn.addEventListener('click', () => {
          action.run();
          dismiss();
        });
      }
    }
    wrap.appendChild(el);
    setTimeout(dismiss, 5000);
  };

  return {
    PRIORITY_META, STATUS_META,
    init, retry, isLoading, getError,
    all, getById, createTask, updateTask, deleteTask, toggleComplete,
    isToday, isOverdue, daysBetween, todayISO, formatLong, formatShort, dueLabel,
    categoryOf, priorityBadge, statusBadge, categoryBadge,
    renderList, emptyState, loadingState, errorState, escapeHTML,
    openModal, closeModal, submitModal, modalDelete, clearTitleError, setModalStatus,
    createCategory, updateCategory, deleteCategory,
    toast
  };
})();

// Initialize Tasks on module load and expose to window
Tasks.init();
window.Tasks = Tasks;
export { Tasks };
