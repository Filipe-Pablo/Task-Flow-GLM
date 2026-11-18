/* ============ TASKFLOW — FILTERS (search, filter, sort) ============ */

const Filters = (() => {
  const state = {
    search: '',
    status: 'all',      // all | todo | inprogress | completed
    priority: 'all',    // all | low | medium | high
    category: 'all',    // all | <categoryId>
    sort: 'duedate',    // duedate | priority | created | title
    view: 'list'        // list | cards
  };

  const resetTransient = () => {
    state.search = '';
    state.status = 'all';
    state.priority = 'all';
    state.category = 'all';
    state.sort = 'duedate';
  };

  const matchesSearch = (task, term, categories) => {
    if (!term) return true;
    const cat = categories.find((c) => c.id === task.category);
    const haystack = [
      task.title,
      task.description,
      cat ? cat.name : ''
    ].join(' ').toLowerCase();
    return haystack.includes(term.toLowerCase());
  };

  const apply = (tasks) => {
    const categories = Storage.getCategories();
    let result = tasks.filter((t) => {
      if (state.status !== 'all' && t.status !== state.status) return false;
      if (state.priority !== 'all' && t.priority !== state.priority) return false;
      if (state.category !== 'all' && t.category !== state.category) return false;
      return matchesSearch(t, state.search, categories);
    });

    const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
    const sorters = {
      duedate: (a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'),
      priority: (a, b) =>
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
        (a.dueDate || '9999').localeCompare(b.dueDate || '9999'),
      created: (a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''),
      title: (a, b) => a.title.localeCompare(b.title)
    };
    result = [...result].sort(sorters[state.sort] || sorters.duedate);

    // Incomplete tasks always float above completed ones
    result.sort((a, b) => (a.status === 'completed') - (b.status === 'completed'));
    return result;
  };

  const countByStatus = (tasks) => ({
    all: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inprogress: tasks.filter((t) => t.status === 'inprogress').length,
    completed: tasks.filter((t) => t.status === 'completed').length
  });

  return { state, apply, countByStatus, resetTransient };
})();
