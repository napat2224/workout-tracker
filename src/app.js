// Tauri 2 IPC (withGlobalTauri: true in tauri.conf.json)
const invoke = window.__TAURI__.core.invoke;

// ── State ──────────────────────────────────────────────────────────────────────
let activeWorkoutId = null;
let allWorkouts = [];

// ── Navigation ─────────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    showView(view);
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${name}`).classList.add('active');
  if (name === 'dashboard') loadDashboard();
  if (name === 'history')   loadHistory();
  if (name === 'progress')  loadProgressSuggestions();
  if (name === 'log' && !activeWorkoutId) resetLogForm();
}

// ── Utilities ──────────────────────────────────────────────────────────────────
function fmt(date) {
  // "YYYY-MM-DD" → "May 1, 2026"
  if (!date) return '';
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function startOfWeekISO() {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
document.getElementById('today-date').textContent = fmt(todayISO());
document.getElementById('start-workout-btn').addEventListener('click', () => {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-view="log"]').classList.add('active');
  showView('log');
  resetLogForm();
});

async function loadDashboard() {
  allWorkouts = await invoke('get_workouts');
  const week = startOfWeekISO();
  const thisWeek = allWorkouts.filter(w => w.date >= week).length;
  document.getElementById('stat-total').textContent = allWorkouts.length;
  document.getElementById('stat-week').textContent = thisWeek;
  document.getElementById('stat-streak').textContent = calcStreak(allWorkouts);

  const container = document.getElementById('recent-workouts');
  const recent = allWorkouts.slice(0, 5);
  if (recent.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🏋️</div>No workouts yet. Hit <strong>+ Start Workout</strong> to begin.</div>`;
    return;
  }
  container.innerHTML = '';
  recent.forEach(w => container.appendChild(workoutCard(w)));
}

function calcStreak(workouts) {
  if (!workouts.length) return 0;
  const dates = [...new Set(workouts.map(w => w.date))].sort().reverse();
  const today = todayISO();
  let streak = 0;
  let cursor = today;
  for (const d of dates) {
    if (d === cursor) {
      streak++;
      const prev = new Date(cursor);
      prev.setDate(prev.getDate() - 1);
      cursor = prev.toISOString().split('T')[0];
    } else break;
  }
  return streak;
}

function workoutCard(w) {
  const card = el('div', 'workout-card');
  const info = el('div', 'workout-card-info');
  const name = el('div', 'workout-card-name', w.name);
  const meta = el('div', 'workout-card-meta');
  const dateSpan = el('span', '', fmt(w.date));
  const exSpan = el('span', '', `${w.exercise_count} exercise${w.exercise_count !== 1 ? 's' : ''}`);
  meta.append(dateSpan, exSpan);
  info.append(name, meta);

  const actions = el('div', 'workout-card-actions');
  const delBtn = el('button', 'btn-icon danger', '🗑');
  delBtn.title = 'Delete workout';
  delBtn.addEventListener('click', async e => {
    e.stopPropagation();
    if (!confirm(`Delete "${w.name}"?`)) return;
    await invoke('delete_workout', { id: w.id });
    await loadDashboard();
  });
  actions.appendChild(delBtn);

  card.append(info, actions);
  card.addEventListener('click', () => openDetail(w.id));
  return card;
}

// ── Log Workout ────────────────────────────────────────────────────────────────
function resetLogForm() {
  activeWorkoutId = null;
  document.getElementById('workout-name').value = '';
  document.getElementById('workout-date').value = todayISO();
  document.getElementById('workout-notes').value = '';
  document.getElementById('exercise-list').innerHTML = '';
  document.getElementById('log-title').textContent = 'New Workout';
  document.getElementById('workout-editor').classList.add('hidden');
  document.getElementById('workout-form-header').style.display = '';
}

document.getElementById('cancel-workout-btn').addEventListener('click', async () => {
  if (activeWorkoutId) {
    if (confirm('Discard this workout?')) {
      await invoke('delete_workout', { id: activeWorkoutId });
      activeWorkoutId = null;
    } else return;
  }
  showView('dashboard');
  document.querySelector('[data-view="dashboard"]').classList.add('active');
  document.querySelector('[data-view="log"]').classList.remove('active');
});

document.getElementById('save-workout-meta-btn').addEventListener('click', async () => {
  const name  = document.getElementById('workout-name').value.trim() || 'Workout';
  const date  = document.getElementById('workout-date').value || todayISO();
  const notes = document.getElementById('workout-notes').value.trim();

  const workout = await invoke('create_workout', { name, date, notes });
  activeWorkoutId = workout.id;
  document.getElementById('log-title').textContent = name;
  document.getElementById('workout-editor').classList.remove('hidden');
  document.getElementById('workout-form-header').style.display = 'none';

  // Populate autocomplete
  const names = await invoke('get_exercise_names');
  const dl = document.getElementById('exercise-suggestions');
  dl.innerHTML = '';
  names.forEach(n => {
    const opt = document.createElement('option');
    opt.value = n;
    dl.appendChild(opt);
  });
});

document.getElementById('add-exercise-btn').addEventListener('click', addExercise);
document.getElementById('new-exercise-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') addExercise();
});

async function addExercise() {
  const input = document.getElementById('new-exercise-name');
  const name = input.value.trim();
  if (!name || !activeWorkoutId) return;

  const exercise = await invoke('add_exercise', { workoutId: activeWorkoutId, name });
  input.value = '';
  renderExerciseBlock(exercise);
}

function renderExerciseBlock(exercise) {
  const list = document.getElementById('exercise-list');
  const block = el('div', 'exercise-block');
  block.dataset.exerciseId = exercise.id;

  const header = el('div', 'exercise-block-header');
  const nameEl = el('span', 'exercise-block-name', exercise.name);
  const delBtn = el('button', 'btn-danger', 'Remove');
  delBtn.addEventListener('click', async () => {
    if (!confirm(`Remove "${exercise.name}"?`)) return;
    await invoke('delete_exercise', { id: exercise.id });
    block.remove();
  });
  header.append(nameEl, delBtn);

  const setsArea = el('div', 'sets-table');
  const table = el('table', 'sets-table-inner');
  const thead = el('thead');
  const hRow = el('tr');
  ['Set', 'Reps', 'Weight (kg)', 'Notes', ''].forEach(h => hRow.appendChild(el('th', '', h)));
  thead.appendChild(hRow);
  const tbody = el('tbody');
  tbody.id = `tbody-${exercise.id}`;
  table.append(thead, tbody);
  setsArea.appendChild(table);

  // Add set row
  const addRow = el('div', 'add-set-row');
  const repsIn   = el('input', 'input-medium set-input');
  repsIn.type = 'number'; repsIn.placeholder = 'Reps'; repsIn.min = '0';
  const weightIn = el('input', 'input-medium set-input');
  weightIn.type = 'number'; weightIn.placeholder = 'kg'; weightIn.step = '0.5'; weightIn.min = '0';
  const notesIn  = el('input', 'input-medium set-input set-input-notes');
  notesIn.type = 'text'; notesIn.placeholder = 'Notes';
  const addBtn = el('button', 'btn-secondary', '+ Add Set');

  async function doAddSet() {
    const reps   = repsIn.value   ? parseInt(repsIn.value)    : null;
    const weight = weightIn.value ? parseFloat(weightIn.value) : null;
    const notes  = notesIn.value.trim();
    const set = await invoke('add_set', { exerciseId: exercise.id, reps, weight, notes });
    appendSetRow(tbody, set, exercise.id);
    repsIn.value = ''; weightIn.value = ''; notesIn.value = '';
    repsIn.focus();
  }

  addBtn.addEventListener('click', doAddSet);
  [repsIn, weightIn, notesIn].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') doAddSet(); }));
  addRow.append(repsIn, weightIn, notesIn, addBtn);

  block.append(header, setsArea, addRow);
  list.appendChild(block);
}

function appendSetRow(tbody, set, exerciseId) {
  const tr = el('tr');
  tr.dataset.setId = set.id;
  const numTd = el('td', '', set.set_number);

  const repsTd = el('td');
  const repsInput = el('input', 'input-medium set-input');
  repsInput.type = 'number'; repsInput.value = set.reps ?? ''; repsInput.placeholder = '—';
  repsTd.appendChild(repsInput);

  const weightTd = el('td');
  const weightInput = el('input', 'input-medium set-input');
  weightInput.type = 'number'; weightInput.value = set.weight ?? ''; weightInput.placeholder = '—'; weightInput.step = '0.5';
  weightTd.appendChild(weightInput);

  const notesTd = el('td');
  const notesInput = el('input', 'input-medium set-input set-input-notes');
  notesInput.type = 'text'; notesInput.value = set.notes ?? ''; notesInput.placeholder = '—';
  notesTd.appendChild(notesInput);

  async function saveSet() {
    await invoke('update_set', {
      id: set.id,
      reps:   repsInput.value   ? parseInt(repsInput.value)    : null,
      weight: weightInput.value ? parseFloat(weightInput.value) : null,
      notes:  notesInput.value.trim(),
    });
  }
  [repsInput, weightInput, notesInput].forEach(i => i.addEventListener('blur', saveSet));

  const delTd = el('td');
  const delBtn = el('button', 'btn-icon danger', '✕');
  delBtn.addEventListener('click', async () => {
    await invoke('delete_set', { id: set.id });
    tr.remove();
    // Renumber remaining rows
    [...tbody.querySelectorAll('tr')].forEach((row, i) => {
      row.querySelector('td').textContent = i + 1;
    });
  });
  delTd.appendChild(delBtn);

  tr.append(numTd, repsTd, weightTd, notesTd, delTd);
  tbody.appendChild(tr);
}

document.getElementById('finish-workout-btn').addEventListener('click', () => {
  if (!activeWorkoutId) return;
  activeWorkoutId = null;
  showView('dashboard');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-view="dashboard"]').classList.add('active');
});

// ── History ────────────────────────────────────────────────────────────────────
async function loadHistory() {
  const workouts = await invoke('get_workouts');
  renderHistory(workouts);

  document.getElementById('history-search').addEventListener('input', function() {
    const q = this.value.toLowerCase();
    const filtered = workouts.filter(w =>
      w.name.toLowerCase().includes(q) || w.date.includes(q)
    );
    renderHistory(filtered);
  });
}

function renderHistory(workouts) {
  const container = document.getElementById('history-list');
  container.innerHTML = '';
  if (!workouts.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div>No workouts found.</div>';
    return;
  }
  workouts.forEach(w => container.appendChild(workoutCard(w)));
}

// ── Detail modal ───────────────────────────────────────────────────────────────
async function openDetail(workoutId) {
  const detail = await invoke('get_workout_detail', { id: workoutId });
  document.getElementById('modal-workout-title').textContent = detail.name;
  document.getElementById('modal-workout-date').textContent = fmt(detail.date);

  const body = document.getElementById('modal-exercises');
  body.innerHTML = '';

  if (!detail.exercises.length) {
    body.innerHTML = '<div class="empty-state">No exercises logged.</div>';
  }

  detail.exercises.forEach(ex => {
    const section = el('div', 'modal-exercise');
    const exName = el('div', 'modal-exercise-name', ex.name);
    section.appendChild(exName);

    if (ex.sets.length) {
      const table = el('table', 'modal-sets-table');
      const thead = el('thead');
      const hRow = el('tr');
      ['Set', 'Reps', 'Weight', 'Notes'].forEach(h => hRow.appendChild(el('th', '', h)));
      thead.appendChild(hRow);
      const tbody = el('tbody');
      ex.sets.forEach(s => {
        const tr = el('tr');
        tr.appendChild(el('td', '', s.set_number));
        tr.appendChild(el('td', '', s.reps != null ? s.reps : '—'));
        tr.appendChild(el('td', '', s.weight != null ? `${s.weight} kg` : '—'));
        tr.appendChild(el('td', '', s.notes || '—'));
        tbody.appendChild(tr);
      });
      table.append(thead, tbody);
      section.appendChild(table);
    } else {
      section.appendChild(el('div', '', 'No sets logged.'));
    }
    body.appendChild(section);
  });

  document.getElementById('detail-modal').classList.remove('hidden');
}

document.getElementById('modal-close-btn').addEventListener('click', () => {
  document.getElementById('detail-modal').classList.add('hidden');
});
document.getElementById('detail-modal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.add('hidden');
});

// ── Progress ───────────────────────────────────────────────────────────────────
async function loadProgressSuggestions() {
  const names = await invoke('get_exercise_names');
  const dl = document.getElementById('progress-suggestions');
  dl.innerHTML = '';
  names.forEach(n => {
    const opt = document.createElement('option');
    opt.value = n;
    dl.appendChild(opt);
  });
}

document.getElementById('load-progress-btn').addEventListener('click', loadProgress);
document.getElementById('progress-exercise-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') loadProgress();
});

async function loadProgress() {
  const name = document.getElementById('progress-exercise-input').value.trim();
  if (!name) return;

  const history = await invoke('get_exercise_history', { name });
  const container = document.getElementById('progress-content');
  container.innerHTML = '';

  if (!history.length) {
    container.innerHTML = `<div class="empty-state">No history found for <strong>${name}</strong>.</div>`;
    return;
  }

  // Bar chart: max weight per session
  const maxWeights = history.filter(e => e.max_weight != null);
  if (maxWeights.length) {
    const h2 = el('h2', '', 'Max Weight per Session');
    h2.style.cssText = 'font-size:13px;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);margin-bottom:12px;';
    container.appendChild(h2);

    const chartMax = Math.max(...maxWeights.map(e => e.max_weight));
    const chartDiv = el('div', 'bar-chart');
    // Show newest 10 sessions
    [...maxWeights].reverse().slice(0, 10).forEach(entry => {
      const row = el('div', 'bar-row');
      const label = el('div', 'bar-label', entry.date.slice(5)); // MM-DD
      const wrap = el('div', 'bar-wrap');
      const fill = el('div', 'bar-fill');
      fill.style.width = `${(entry.max_weight / chartMax) * 100}%`;
      const val = el('div', 'bar-value', `${entry.max_weight} kg`);
      wrap.appendChild(fill);
      row.append(label, wrap, val);
      chartDiv.appendChild(row);
    });
    container.appendChild(chartDiv);
  }

  // Detailed entries
  const h2 = el('h2', '');
  h2.textContent = 'Session Log';
  h2.style.cssText = 'font-size:13px;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);margin:24px 0 12px;';
  container.appendChild(h2);

  history.forEach(entry => {
    const card = el('div', 'progress-entry');
    const header = el('div', 'progress-entry-header');
    const left = el('div');
    left.appendChild(el('div', 'progress-entry-date', fmt(entry.date)));
    left.appendChild(el('div', 'progress-entry-meta', entry.workout_name));
    const badges = el('div', 'progress-badges');
    if (entry.max_weight != null) {
      const b = el('span', 'badge highlight', `⬆ ${entry.max_weight} kg`);
      badges.appendChild(b);
    }
    if (entry.total_volume > 0) {
      badges.appendChild(el('span', 'badge', `Vol: ${Math.round(entry.total_volume)} kg`));
    }
    badges.appendChild(el('span', 'badge', `${entry.sets.length} set${entry.sets.length !== 1 ? 's' : ''}`));
    header.append(left, badges);
    card.appendChild(header);

    if (entry.sets.length) {
      const table = el('table', 'modal-sets-table');
      const thead = el('thead');
      const hRow = el('tr');
      ['Set', 'Reps', 'Weight'].forEach(h => hRow.appendChild(el('th', '', h)));
      thead.appendChild(hRow);
      const tbody = el('tbody');
      entry.sets.forEach(s => {
        const tr = el('tr');
        tr.appendChild(el('td', '', s.set_number));
        tr.appendChild(el('td', '', s.reps != null ? s.reps : '—'));
        tr.appendChild(el('td', '', s.weight != null ? `${s.weight} kg` : '—'));
        tbody.appendChild(tr);
      });
      table.append(thead, tbody);
      card.appendChild(table);
    }

    container.appendChild(card);
  });
}

// ── Boot ───────────────────────────────────────────────────────────────────────
loadDashboard();
