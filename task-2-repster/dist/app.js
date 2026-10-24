(() => {
  'use strict';
  const WORKOUT_KEY = 'pulse-workouts-v2';
  const HISTORY_KEY = 'repster-history-v1';
  const GOAL_KEY = 'repster-weekly-goal';
  const THEME_KEY = 'pulse-theme';
  const $ = (selector) => document.querySelector(selector);
  const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const addDays = (days) => { const d = new Date(); d.setDate(d.getDate() + days); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const dateLabel = (date) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const read = (key, fallback) => { try { const value = localStorage.getItem(key); return value === null ? fallback : JSON.parse(value); } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const id = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const presets = (category) => {
    if (category === 'Cardio') return [{ name: 'Easy pace', sets: 1, reps: 20, weight: 'minutes' }, { name: 'Cool down', sets: 1, reps: 5, weight: 'minutes' }];
    if (category === 'Mobility') return [{ name: 'Hip mobility flow', sets: 2, reps: 8, weight: 'bodyweight' }, { name: 'Shoulder circles', sets: 2, reps: 10, weight: 'bodyweight' }];
    if (category === 'Recovery') return [{ name: 'Recovery walk', sets: 1, reps: 20, weight: 'minutes' }];
    return [{ name: 'Goblet squat', sets: 3, reps: 10, weight: '12 kg' }, { name: 'Dumbbell row', sets: 3, reps: 10, weight: '10 kg' }];
  };
  const sampleWorkouts = [
    { id: id(), name: 'Lower body strength', category: 'Strength', date: addDays(0), duration: 45, done: true, exercises: presets('Strength') },
    { id: id(), name: 'Easy outdoor run', category: 'Cardio', date: addDays(1), duration: 30, done: false, exercises: presets('Cardio') },
    { id: id(), name: 'Mobility reset', category: 'Mobility', date: addDays(2), duration: 20, done: true, exercises: presets('Mobility') },
    { id: id(), name: 'Upper body strength', category: 'Strength', date: addDays(3), duration: 45, done: false, exercises: presets('Strength') },
    { id: id(), name: 'Recovery walk', category: 'Recovery', date: addDays(4), duration: 25, done: false, exercises: presets('Recovery') }
  ];
  let workouts = read(WORKOUT_KEY, null);
  const firstVisit = !Array.isArray(workouts);
  if (firstVisit) { workouts = sampleWorkouts; write(WORKOUT_KEY, workouts); }
  workouts = workouts.map(workout => ({ ...workout, exercises: Array.isArray(workout.exercises) && workout.exercises.length ? workout.exercises : presets(workout.category) }));
  write(WORKOUT_KEY, workouts);
  let history = read(HISTORY_KEY, []);
  if (!Array.isArray(history)) history = [];
  if (firstVisit && localStorage.getItem(HISTORY_KEY) === null) {
    history = [
      { name: 'Lower body strength', date: today(), sets: 6, volume: 660 },
      { name: 'Mobility reset', date: today(), sets: 4, volume: 0 }
    ];
    write(HISTORY_KEY, history);
  }
  let filter = 'all';
  let activeId = null;
  let checks = {};
  let restInterval = null;
  let toastTimeout = null;

  function notice(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
  }
  function save() { write(WORKOUT_KEY, workouts); render(); }
  function nextWorkout() { return [...workouts].filter(w => !w.done).sort((a, b) => a.date.localeCompare(b.date))[0]; }

  function renderWeek() {
    const start = new Date();
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    $('#weekStrip').innerHTML = Array.from({ length: 7 }, (_, index) => {
      const d = new Date(start);
      d.setDate(start.getDate() + index);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString(undefined, { weekday: 'short' });
      return `<button class="day ${key === today() ? 'today' : ''} ${workouts.some(w => w.date === key) ? 'has-workout' : ''}" type="button" data-day="${key}" aria-label="Plan a session for ${dateLabel(key)}"><span>${label}</span><strong>${d.getDate()}</strong><i></i></button>`;
    }).join('');
  }

  function renderSessions() {
    const search = $('#search').value.trim().toLowerCase();
    const list = workouts.filter(w => (filter === 'all' || (filter === 'active' ? !w.done : w.done)) && (!search || w.name.toLowerCase().includes(search) || w.category.toLowerCase().includes(search))).sort((a, b) => a.date.localeCompare(b.date));
    $('#sessionList').innerHTML = list.length ? list.map((w, index) => `<article class="session ${w.done ? 'done' : ''}" style="animation-delay:${Math.min(index * 45, 270)}ms"><button class="session-check ${w.done ? 'checked' : ''}" type="button" data-complete="${escapeHTML(w.id)}" aria-label="${w.done ? 'Mark upcoming' : 'Mark complete'}: ${escapeHTML(w.name)}">${w.done ? '✓' : ''}</button><div class="session-info"><span class="session-category">${escapeHTML(w.category)}</span><div class="session-title">${escapeHTML(w.name)}</div><div class="session-meta">${dateLabel(w.date)} &nbsp;·&nbsp; ${Number(w.duration) || 0} min &nbsp;·&nbsp; ${w.exercises.length} exercises</div></div><div class="session-actions"><button class="start-action" type="button" data-start="${escapeHTML(w.id)}">${w.done ? 'Repeat' : 'Start'} ↗</button><button class="icon-action" type="button" data-edit="${escapeHTML(w.id)}" aria-label="Edit ${escapeHTML(w.name)}" title="Edit">✎</button><button class="icon-action" type="button" data-delete="${escapeHTML(w.id)}" aria-label="Delete ${escapeHTML(w.name)}" title="Delete">×</button></div></article>`).join('') : `<div class="empty-state"><strong>${search ? 'No matching sessions.' : 'Your next session starts here.'}</strong><p>${search ? 'Try another search.' : 'Add a session and make this week yours.'}</p>${search ? '' : '<button class="button button-primary" type="button" data-add>Add a session</button>'}</div>`;
  }

  function renderSummary() {
    const done = workouts.filter(w => w.done).length;
    $('#totalSessions').textContent = String(workouts.length).padStart(2, '0');
    $('#doneSessions').textContent = String(done).padStart(2, '0');
    $('#trainingMinutes').textContent = String(workouts.reduce((sum, w) => sum + (w.done ? Number(w.duration) || 0 : 0), 0)).padStart(2, '0');
    const next = nextWorkout();
    $('#focusName').textContent = next ? next.name : 'A fresh session is yours to plan.';
    $('#focusMeta').textContent = next ? `${dateLabel(next.date)} · ${next.duration} min · ${next.category}` : 'Choose a day and build your plan.';
    $('#focusStart').textContent = next ? 'Start session ↗' : 'Plan a session ↗';
    $('#heroStart').innerHTML = next ? 'Start next session <span aria-hidden="true">↗</span>' : 'Plan your next session <span aria-hidden="true">↗</span>';
    $('#heroCaption').textContent = next ? `NEXT UP / ${next.name.toUpperCase()}` : 'YOUR NEXT SESSION IS WAITING';
  }

  function renderGoal() {
    const goal = Math.max(2, Math.min(6, Number(localStorage.getItem(GOAL_KEY)) || 4));
    $('#goalSelect').value = String(goal);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);
    const completed = workouts.filter(w => w.done && new Date(`${w.date}T12:00:00`) >= weekStart).length;
    $('#goalCount').textContent = String(completed);
    $('#goalTotal').textContent = `/ ${goal}`;
    $('#goalProgress').style.width = `${Math.min(100, completed / goal * 100)}%`;
    $('#goalMessage').textContent = completed >= goal ? 'Target reached. Keep showing up for yourself.' : `${goal - completed} more ${goal - completed === 1 ? 'session' : 'sessions'} to reach your weekly target.`;
  }

  function renderHistory() {
    $('#historyList').innerHTML = history.length ? history.slice(0, 4).map(item => `<div class="history-item"><strong>${escapeHTML(item.name)}</strong><span>${dateLabel(item.date)} · ${Number(item.sets) || 0} sets</span></div>`).join('') : '<p class="history-empty">Finish a workout to start your training log.</p>';
    const volume = history.reduce((sum, item) => sum + (Number(item.volume) || 0), 0);
    $('#loadVolume').textContent = `${volume.toLocaleString()} kg`;
  }

  function render() { renderWeek(); renderSessions(); renderSummary(); renderGoal(); renderHistory(); }

  function openEditor(workoutId, date) {
    const workout = workouts.find(w => w.id === workoutId);
    $('#editorTitle').textContent = workout ? 'Edit session' : 'Plan a session';
    $('#editId').value = workout?.id || '';
    $('#sessionName').value = workout?.name || '';
    $('#category').value = workout?.category || 'Strength';
    $('#sessionDate').value = workout?.date || date || today();
    $('#duration').value = workout?.duration || 45;
    $('#exercisePlan').value = workout ? workout.exercises.map(ex => `${ex.name} | ${ex.sets} | ${ex.reps} | ${ex.weight}`).join('\n') : '';
    $('#editor').showModal();
    if (!workout) $('#sessionName').focus();
  }

  function parseExercises(input, category) {
    const exercises = input.split('\n').map(line => {
      const parts = line.split('|').map(p => p.trim());
      if (!parts[0]) return null;
      return { name: parts[0].slice(0, 80), sets: Math.max(1, Math.min(12, Number(parts[1]) || 3)), reps: Math.max(1, Math.min(100, Number(parts[2]) || 10)), weight: (parts[3] || 'bodyweight').slice(0, 32) };
    }).filter(Boolean);
    return exercises.length ? exercises : presets(category);
  }

  function startWorkout(workoutId) {
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;
    activeId = workout.id;
    checks = read(`repster-active-${activeId}`, {});
    if (!checks || typeof checks !== 'object') checks = {};
    $('#runnerTitle').textContent = workout.name;
    $('#runnerMeta').textContent = `${workout.duration} min planned · Check off each set as you go`;
    $('#exerciseSets').innerHTML = workout.exercises.map((ex, exerciseIndex) => `<div class="exercise-block"><strong>${escapeHTML(ex.name)}</strong><span>${Number(ex.sets)} sets · ${Number(ex.reps)} reps · ${escapeHTML(ex.weight)}</span><div class="set-buttons">${Array.from({ length: Math.max(1, Math.min(12, Number(ex.sets) || 1)) }, (_, setIndex) => { const key = `${exerciseIndex}-${setIndex}`; return `<button class="set-button ${checks[key] ? 'checked' : ''}" type="button" data-set="${key}" aria-pressed="${checks[key] ? 'true' : 'false'}">${checks[key] ? '✓ ' : ''}Set ${setIndex + 1}</button>`; }).join('')}</div></div>`).join('');
    $('#restClock').textContent = '01:00';
    $('#runner').showModal();
  }

  function stopRest() { if (restInterval) { clearInterval(restInterval); restInterval = null; } }
  function closeRunner() { stopRest(); $('#runner').close(); }

  document.body.classList.toggle('light', localStorage.getItem(THEME_KEY) === 'light');
  function updateThemeButton() {
    const light = document.body.classList.contains('light');
    $('#themeIcon').textContent = light ? '☾' : '☀';
    $('#themeToggle').setAttribute('aria-label', `Switch to ${light ? 'dark' : 'light'} theme`);
    $('meta[name="theme-color"]').content = light ? '#f4f4ee' : '#111411';
  }
  updateThemeButton();
  $('#themeToggle').addEventListener('click', () => { const light = document.body.classList.toggle('light'); localStorage.setItem(THEME_KEY, light ? 'light' : 'dark'); updateThemeButton(); });
  $('#today').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  $('#addSession').addEventListener('click', () => openEditor());
  $('#heroPlan').addEventListener('click', () => openEditor());
  $('#heroStart').addEventListener('click', () => { const next = nextWorkout(); next ? startWorkout(next.id) : openEditor(); });
  $('#focusStart').addEventListener('click', () => { const next = nextWorkout(); next ? startWorkout(next.id) : openEditor(); });
  $('#weekStrip').addEventListener('click', event => { const button = event.target.closest('[data-day]'); if (button) openEditor(null, button.dataset.day); });
  $('#goalSelect').addEventListener('change', event => { localStorage.setItem(GOAL_KEY, event.target.value); renderGoal(); });
  $('#search').addEventListener('input', renderSessions);
  document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter; document.querySelectorAll('.filter').forEach(item => item.classList.toggle('active', item === button)); renderSessions(); }));
  $('#sessionList').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-add')) return openEditor();
    if (button.dataset.start) return startWorkout(button.dataset.start);
    if (button.dataset.edit) return openEditor(button.dataset.edit);
    if (button.dataset.complete) { const workout = workouts.find(w => w.id === button.dataset.complete); if (!workout) return; workout.done = !workout.done; save(); notice(workout.done ? 'Session complete. You showed up.' : 'Session moved to upcoming.'); return; }
    if (button.dataset.delete) { const workout = workouts.find(w => w.id === button.dataset.delete); if (!workout || !confirm(`Delete “${workout.name}”?`)) return; workouts = workouts.filter(w => w.id !== workout.id); localStorage.removeItem(`repster-active-${workout.id}`); save(); notice('Session deleted.'); }
  });
  $('#closeEditor').addEventListener('click', () => $('#editor').close());
  $('#cancelEditor').addEventListener('click', () => $('#editor').close());
  $('#sessionForm').addEventListener('submit', event => {
    event.preventDefault();
    const workoutId = $('#editId').value;
    const previous = workouts.find(w => w.id === workoutId);
    const item = { id: previous?.id || id(), name: $('#sessionName').value.trim(), category: $('#category').value, date: $('#sessionDate').value, duration: Number($('#duration').value), done: previous?.done || false, exercises: parseExercises($('#exercisePlan').value, $('#category').value) };
    if (!item.name) return;
    if (previous) workouts = workouts.map(w => w.id === workoutId ? item : w); else workouts.push(item);
    $('#editor').close(); save(); notice(previous ? 'Session updated.' : 'Session added. Let’s get to work.');
  });
  $('#closeRunner').addEventListener('click', closeRunner);
  $('#saveForLater').addEventListener('click', () => { closeRunner(); notice('Your set progress is saved for later.'); });
  $('#runner').addEventListener('close', stopRest);
  $('#exerciseSets').addEventListener('click', event => {
    const button = event.target.closest('[data-set]'); if (!button) return;
    const key = button.dataset.set; checks[key] = !checks[key]; write(`repster-active-${activeId}`, checks);
    button.classList.toggle('checked', checks[key]); button.setAttribute('aria-pressed', String(!!checks[key])); button.textContent = `${checks[key] ? '✓ ' : ''}Set ${Number(key.split('-')[1]) + 1}`;
  });
  $('#restButton').addEventListener('click', () => {
    stopRest(); let seconds = 60; $('#restClock').textContent = '01:00';
    restInterval = setInterval(() => { seconds--; $('#restClock').textContent = `00:${String(Math.max(0, seconds)).padStart(2, '0')}`; if (seconds <= 0) { stopRest(); $('#restClock').textContent = 'DONE'; notice('Rest complete. Ready for the next set.'); } }, 1000);
  });
  $('#finishWorkout').addEventListener('click', () => {
    const workout = workouts.find(w => w.id === activeId); if (!workout) return;
    const checked = Object.values(checks).filter(Boolean).length;
    if (!checked) return notice('Check off at least one set before finishing.');
    let volume = 0;
    workout.exercises.forEach((ex, exIndex) => { const load = Number(String(ex.weight).match(/[\d.]+/)?.[0]) || 0; for (let setIndex = 0; setIndex < Number(ex.sets); setIndex++) if (checks[`${exIndex}-${setIndex}`]) volume += load * Number(ex.reps); });
    workout.done = true;
    history.unshift({ name: workout.name, date: today(), sets: checked, volume: Math.round(volume) });
    history = history.slice(0, 100); write(HISTORY_KEY, history);
    localStorage.removeItem(`repster-active-${activeId}`);
    closeRunner(); save(); notice('Workout logged. You showed up for yourself.');
  });
  render();
})();
