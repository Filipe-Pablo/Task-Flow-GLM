/* ============ TASKFLOW — STORAGE (LocalStorage persistence) ============ */

const Storage = (() => {
  const KEYS = {
    tasks: 'taskflow.tasks',
    categories: 'taskflow.categories',
    prefs: 'taskflow.prefs',
    profile: 'taskflow.profile'
  };

  const read = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable — app still works in-memory for the session */
    }
  };

  const uid = (prefix) =>
    prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* Date helpers — local ISO yyyy-mm-dd relative to today */
  const toLocalISO = (d) =>
    d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');

  const dayISO = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return toLocalISO(d);
  };

  const isoDaysAgo = (offset) => dayISO(-offset);

  const SEED_CATEGORIES = [
    { id: 'cat-work',     name: 'Work',     color: '#7C5CFC' },
    { id: 'cat-design',   name: 'Design',   color: '#2ECC71' },
    { id: 'cat-personal', name: 'Personal', color: '#F4B740' }
  ];

  const SEED_TASKS = [
    {
      id: 'task-1',
      title: 'Complete the project proposal',
      description: 'Finalize executive summary, resource allocation matrix, and roadmap timeline for Q4 deliverables.',
      dueDate: dayISO(0),
      createdAt: isoDaysAgo(2),
      completedAt: null,
      priority: 'high',
      category: 'cat-work',
      status: 'inprogress'
    },
    {
      id: 'task-2',
      title: 'Review UI design concepts',
      description: 'Provide design critique on navigation flow, token color consistency, and mobile sheet interactions.',
      dueDate: dayISO(1),
      createdAt: isoDaysAgo(1),
      completedAt: null,
      priority: 'medium',
      category: 'cat-design',
      status: 'todo'
    },
    {
      id: 'task-3',
      title: 'Read 20 pages of a book',
      description: "Chapter 4 & 5 of 'Designing Data-Intensive Applications' by Martin Kleppmann.",
      dueDate: isoDaysAgo(1),
      createdAt: isoDaysAgo(4),
      completedAt: isoDaysAgo(1),
      priority: 'low',
      category: 'cat-personal',
      status: 'completed'
    },
    {
      id: 'task-4',
      title: 'Prepare weekly meeting',
      description: 'Gather sprint velocity metrics, unblock cross-functional dependencies, and draft agenda slides.',
      dueDate: dayISO(3),
      createdAt: isoDaysAgo(1),
      completedAt: null,
      priority: 'high',
      category: 'cat-work',
      status: 'todo'
    },
    {
      id: 'task-5',
      title: 'Organize workspace',
      description: 'Clear desk, clean keyboard, and organize physical sketches and wireframe notebooks.',
      dueDate: isoDaysAgo(3),
      createdAt: isoDaysAgo(6),
      completedAt: isoDaysAgo(2),
      priority: 'low',
      category: 'cat-personal',
      status: 'completed'
    }
  ];

  const DEFAULT_PREFS = {
    theme: 'dark',
    viewMode: 'list',
    notifications: true
  };

  const DEFAULT_PROFILE = {
    name: 'Alex Rivera',
    email: 'alex.rivera@taskflow.app',
    role: 'Product Designer'
  };

  const init = () => {
    // Seed only when no data exists — never overwrite user data
    if (localStorage.getItem(KEYS.tasks) === null) write(KEYS.tasks, SEED_TASKS);
    if (localStorage.getItem(KEYS.categories) === null) write(KEYS.categories, SEED_CATEGORIES);
    if (localStorage.getItem(KEYS.prefs) === null) write(KEYS.prefs, DEFAULT_PREFS);
    if (localStorage.getItem(KEYS.profile) === null) write(KEYS.profile, DEFAULT_PROFILE);
  };

  return {
    init,
    uid,
    getTasks: () => read(KEYS.tasks, []),
    saveTasks: (t) => write(KEYS.tasks, t),
    getCategories: () => read(KEYS.categories, SEED_CATEGORIES),
    saveCategories: (c) => write(KEYS.categories, c),
    getPrefs: () => ({ ...DEFAULT_PREFS, ...read(KEYS.prefs, {}) }),
    savePrefs: (p) => write(KEYS.prefs, p),
    getProfile: () => ({ ...DEFAULT_PROFILE, ...read(KEYS.profile, {}) }),
    saveProfile: (p) => write(KEYS.profile, p)
  };
})();
