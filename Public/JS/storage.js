/* ============ TASKFLOW — STORAGE (User Preferences & Profile) ============ */

const Storage = (() => {
  const KEYS = {
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

  const SEED_CATEGORIES = [
    { id: 'cat-work',     name: 'Work',     color: '#7C5CFC' },
    { id: 'cat-design',   name: 'Design',   color: '#2ECC71' },
    { id: 'cat-personal', name: 'Personal', color: '#F4B740' }
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
    // Purge any legacy tasks from localStorage to guarantee no hardcoded/local tasks persist
    try {
      localStorage.removeItem('taskflow.tasks');
    } catch {
      /* ignore */
    }

    if (localStorage.getItem(KEYS.categories) === null) write(KEYS.categories, SEED_CATEGORIES);
    if (localStorage.getItem(KEYS.prefs) === null) write(KEYS.prefs, DEFAULT_PREFS);
    if (localStorage.getItem(KEYS.profile) === null) write(KEYS.profile, DEFAULT_PROFILE);
  };

  return {
    init,
    uid,
    getCategories: () => read(KEYS.categories, SEED_CATEGORIES),
    saveCategories: (c) => write(KEYS.categories, c),
    getPrefs: () => ({ ...DEFAULT_PREFS, ...read(KEYS.prefs, {}) }),
    savePrefs: (p) => write(KEYS.prefs, p),
    getProfile: () => ({ ...DEFAULT_PROFILE, ...read(KEYS.profile, {}) }),
    saveProfile: (p) => write(KEYS.profile, p)
  };
})();
