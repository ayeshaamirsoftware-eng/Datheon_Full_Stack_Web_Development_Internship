(() => {
  'use strict';
  const WORKOUT_KEY = 'pulse-workouts-v2';
  const HISTORY_KEY = 'repster-history-v1';
  const GOAL_KEY = 'repster-weekly-goal';
  const THEME_KEY = 'pulse-theme';
  const $ = (selector) => document.querySelector(selector);
  const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const dateLabel = (date) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  let storageWarning = '';
  const getStored = (key) => {
    try { return localStorage.getItem(key); }
    catch { storageWarning = 'Browser storage is unavailable, so changes may not remain after you close this page.'; return null; }
  };
  const removeStored = (key) => {
    try { localStorage.removeItem(key); return true; }
    catch { storageWarning = 'Browser storage is unavailable, so changes may not remain after you close this page.'; return false; }
  };
  const read = (key, fallback) => {
    let value = null;
    try {
      value = getStored(key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      if (key === THEME_KEY && (value === 'light' || value === 'dark')) return value;
      storageWarning = 'Some saved data could not be read. REPSTER opened safely with the data it could recover.';
      return fallback;
    }
  };
  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      storageWarning = 'This browser could not save your latest change. Check that browser storage is available.';
      return false;
    }
  };
  const id = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const CARDIO_EXERCISES = new Set(['Walking', 'Running', 'Easy pace', 'Cool down', 'Recovery walk']);
  const EXERCISE_TIPS = {
    'Squat': 'Keep your chest tall and let your knees follow the direction of your toes.',
    'Goblet squat': 'Hold the weight close to your chest and sit down between your hips.',
    'Leg press': 'Keep your back supported and avoid locking your knees at the top.',
    'Deadlift': 'Keep the weight close and push the floor away with a neutral back.',
    'Romanian deadlift': 'Push your hips back and stop when your hamstrings feel a comfortable stretch.',
    'Bench press': 'Keep your feet planted and lower the weight with control.',
    'Chest press': 'Keep your shoulders supported and press without locking your elbows.',
    'Shoulder press': 'Brace your body and press upward without leaning back.',
    'Lat pulldown': 'Pull toward your upper chest while keeping your shoulders down.',
    'Seated row': 'Sit tall and pull your elbows back without shrugging.',
    'Dumbbell row': 'Keep your back steady and pull the weight toward your hip.',
    'Bicep curl': 'Keep your elbows near your sides and avoid swinging.',
    'Tricep pushdown': 'Keep your elbows still and straighten your arms with control.',
    'Walking': 'Choose a pace where you can still speak in short sentences.',
    'Running': 'Start comfortably and slow down if your form or breathing becomes difficult.',
    'Easy pace': 'Move at a pace where you can still speak in short sentences.',
    'Cool down': 'Slow your pace gradually and let your breathing settle.',
    'Recovery walk': 'Keep the pace easy and focus on relaxed, steady movement.'
  };
  const STARTER_TEMPLATES = {
    full: { name: 'Beginner full body', duration: 35, exercises: [
      { name: 'Goblet squat', sets: 3, reps: 10, weight: '0 kg', mode: 'strength' },
      { name: 'Chest press', sets: 3, reps: 10, weight: '0 kg', mode: 'strength' },
      { name: 'Lat pulldown', sets: 3, reps: 10, weight: '0 kg', mode: 'strength' }
    ] },
    upper: { name: 'Beginner upper body', duration: 35, exercises: [
      { name: 'Chest press', sets: 3, reps: 10, weight: '0 kg', mode: 'strength' },
      { name: 'Lat pulldown', sets: 3, reps: 10, weight: '0 kg', mode: 'strength' },
      { name: 'Shoulder press', sets: 2, reps: 10, weight: '0 kg', mode: 'strength' }
    ] },
    lower: { name: 'Beginner lower body', duration: 35, exercises: [
      { name: 'Goblet squat', sets: 3, reps: 10, weight: '0 kg', mode: 'strength' },
      { name: 'Leg press', sets: 3, reps: 10, weight: '0 kg', mode: 'strength' },
      { name: 'Romanian deadlift', sets: 2, reps: 10, weight: '0 kg', mode: 'strength' }
    ] }
  };
  const isCardioExercise = (exercise) => exercise?.mode === 'cardio' || CARDIO_EXERCISES.has(exercise?.name) || /minutes?/i.test(String(exercise?.weight || ''));
  const exerciseTip = (name) => EXERCISE_TIPS[name] || 'Use a comfortable range of motion and stop if something feels painful.';
  const exerciseTarget = (exercise) => {
    if (isCardioExercise(exercise)) {
      const distance = Number(String(exercise.weight).match(/[\d.]+/)?.[0]) || 0;
      return `${Number(exercise.reps) || 1} min${distance > 0 ? ` · ${distance} km` : ''}`;
    }
    return `${Number(exercise.sets)} ${Number(exercise.sets) === 1 ? 'set' : 'sets'} · ${Number(exercise.reps)} reps · ${exercise.weight}`;
  };
  let workouts = read(WORKOUT_KEY, []);
  if (!Array.isArray(workouts)) {
    storageWarning = 'Your saved workout list was not in a usable format, so REPSTER opened a clean list safely.';
    workouts = [];
  }
  workouts = workouts.filter(workout => workout && typeof workout === 'object').map(workout => ({
    ...workout,
    id: String(workout.id || id()),
    name: String(workout.name || 'Untitled workout'),
    category: String(workout.category || 'Strength'),
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(workout.date || '')) ? workout.date : today(),
    duration: Math.max(5, Math.min(300, Number(workout.duration) || 45)),
    done: Boolean(workout.done),
    exercises: Array.isArray(workout.exercises) ? workout.exercises.filter(exercise => exercise && typeof exercise === 'object').map(exercise => ({
      name: String(exercise.name || 'Exercise'),
      sets: Math.max(1, Math.min(12, Number(exercise.sets) || 1)),
      reps: Math.max(1, Math.min(100, Number(exercise.reps) || 1)),
      weight: String(exercise.weight ?? '0 kg'),
      mode: exercise.mode === 'cardio' || workout.category === 'Cardio' || CARDIO_EXERCISES.has(exercise.name) || /minutes?/i.test(String(exercise.weight || '')) ? 'cardio' : 'strength'
    })) : []
  }));
  let history = read(HISTORY_KEY, []);
  if (!Array.isArray(history)) {
    storageWarning = 'Your saved workout history was not in a usable format. REPSTER opened safely without it.';
    history = [];
  }
  let filter = 'all';
  let activeId = null;
  let checks = {};
  let editorExercises = [];
  let activeExerciseIndex = 0;
  let runnerFinished = false;
  let restInterval = null;
  let toastTimeout = null;
  let inlineNoticeTimeout = null;

  function notice(message, undoAction) {
    const toast = $('#toast');
    toast.replaceChildren();
    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);
    if (undoAction) {
      const undo = document.createElement('button');
      undo.type = 'button';
      undo.textContent = 'Undo';
      undo.addEventListener('click', () => {
        clearTimeout(toastTimeout);
        undoAction();
        toast.classList.remove('show');
      }, { once: true });
      toast.appendChild(undo);
    }
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), undoAction ? 5000 : 2500);
  }
  function save() {
    const saved = write(WORKOUT_KEY, workouts);
    render();
    if (!saved) notice(storageWarning);
  }
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
      const hasWorkout = workouts.some(w => w.date === key);
      return `<button class="day ${key === today() ? 'today' : ''} ${hasWorkout ? 'has-workout' : ''}" type="button" data-day="${key}" aria-label="${hasWorkout ? 'Add another workout on' : 'Plan a workout for'} ${dateLabel(key)}"><span>${label}</span><strong>${d.getDate()}</strong><i></i></button>`;
    }).join('');
  }

  function renderSessions() {
    const search = $('#search').value.trim().toLowerCase();
    const list = workouts.filter(w => (filter === 'all' || (filter === 'active' ? !w.done : w.done)) && (!search || w.name.toLowerCase().includes(search) || w.category.toLowerCase().includes(search))).sort((a, b) => a.date.localeCompare(b.date));
    $('#sessionList').innerHTML = list.length ? list.map((w, index) => `<article class="session ${w.done ? 'done' : ''}" style="animation-delay:${Math.min(index * 45, 270)}ms"><span class="session-status ${w.done ? 'checked' : ''}" aria-label="${w.done ? 'Completed' : 'Ready to start'}">${w.done ? '✓' : '•'}</span><button class="session-info" type="button" data-edit="${escapeHTML(w.id)}" aria-label="Edit workout: ${escapeHTML(w.name)}"><span class="session-category">${escapeHTML(w.category)}</span><span class="session-title">${escapeHTML(w.name)}</span><span class="session-meta">${dateLabel(w.date)} &nbsp;·&nbsp; ${w.exercises.length} ${w.exercises.length === 1 ? 'exercise' : 'exercises'} &nbsp;·&nbsp; ${Number(w.duration) || 0} min</span></button><div class="session-actions"><button class="start-action" type="button" data-start="${escapeHTML(w.id)}">${w.done ? 'Repeat workout' : 'Start workout'}</button><button class="card-action" type="button" data-edit="${escapeHTML(w.id)}">Edit</button><button class="card-action delete-action" type="button" data-delete="${escapeHTML(w.id)}">Delete</button></div></article>`).join('') : `<div class="empty-state"><strong>${search ? 'No matching workouts.' : 'Your first workout starts here.'}</strong><p>${search ? 'Try another search.' : 'Add a simple workout, then REPSTER will guide you through it one exercise at a time.'}</p>${search ? '' : '<button class="button button-primary" type="button" data-add>Create your first workout</button>'}</div>`;
  }

  function renderSummary() {
    const done = workouts.filter(w => w.done).length;
    $('#totalSessions').textContent = String(workouts.length).padStart(2, '0');
    $('#doneSessions').textContent = String(done).padStart(2, '0');
    $('#trainingMinutes').textContent = String(workouts.reduce((sum, w) => sum + (w.done ? Number(w.duration) || 0 : 0), 0)).padStart(2, '0');
    const next = nextWorkout();
    $('#focusName').textContent = next ? next.name : 'A fresh session is yours to plan.';
    $('#focusMeta').textContent = next ? `${dateLabel(next.date)} · ${next.duration} min · ${next.category}` : 'Choose a day and build your plan.';
    $('#focusStart').textContent = next ? 'Start workout ↗' : 'Plan a workout ↗';
    $('#heroStart').innerHTML = next ? 'Start next workout <span aria-hidden="true">↗</span>' : 'Plan your next workout <span aria-hidden="true">↗</span>';
    $('#heroCaption').textContent = next ? `NEXT UP / ${next.name.toUpperCase()}` : 'YOUR NEXT SESSION IS WAITING';
  }

  function renderGoal() {
    const goal = Math.max(2, Math.min(6, Number(read(GOAL_KEY, 4)) || 4));
    $('#goalSelect').value = String(goal);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);
    const completed = workouts.filter(w => w.done && new Date(`${w.completionDate || w.date}T12:00:00`) >= weekStart).length;
    $('#goalCount').textContent = String(completed);
    $('#goalTotal').textContent = `/ ${goal}`;
    $('#goalProgress').style.width = `${Math.min(100, completed / goal * 100)}%`;
    $('#goalMessage').textContent = completed >= goal ? 'Target reached. Keep showing up for yourself.' : `${goal - completed} more ${goal - completed === 1 ? 'session' : 'sessions'} to reach your weekly target.`;
  }

  function renderHistory() {
    $('#historyList').innerHTML = history.length ? history.slice(0, 4).map(item => `<div class="history-item"><strong>${escapeHTML(item.name)}</strong><span>${dateLabel(item.date)} · ${Number(item.sets) || 0} ${escapeHTML(item.unit || 'sets')}</span></div>`).join('') : '<p class="history-empty">Finish a workout to start your training log.</p>';
    const volume = history.reduce((sum, item) => sum + (Number(item.volume) || 0), 0);
    $('#loadVolume').textContent = `${volume.toLocaleString()} kg`;
  }

  function render() { renderWeek(); renderSessions(); renderSummary(); renderGoal(); renderHistory(); }

  function renderEditorExercises() {
    $('#plannedExercises').innerHTML = editorExercises.length ? editorExercises.map((exercise, index) => `<div class="planned-exercise"><span>${index + 1}</span><div><strong>${escapeHTML(exercise.name)}</strong><small>${escapeHTML(exerciseTarget(exercise))}</small></div><div class="exercise-actions"><button type="button" data-move-up="${index}" aria-label="Move ${escapeHTML(exercise.name)} up" ${index === 0 ? 'disabled' : ''}>Move up</button><button type="button" data-move-down="${index}" aria-label="Move ${escapeHTML(exercise.name)} down" ${index === editorExercises.length - 1 ? 'disabled' : ''}>Move down</button><button class="exercise-delete" type="button" data-delete-exercise="${index}" aria-label="Delete ${escapeHTML(exercise.name)}">Delete</button></div></div>`).join('') : '<p class="exercise-empty">No exercises yet. Add one yourself or choose a starter plan above.</p>';
  }

  function setFieldError(errorId, message, input) {
    const error = $(errorId);
    error.textContent = message;
    error.hidden = !message;
    if (input) input.setAttribute('aria-invalid', String(Boolean(message)));
  }

  function resetExerciseForm() {
    $('#exerciseName').value = '';
    $('#customExerciseName').value = '';
    $('#customExerciseLabel').hidden = true;
    $('#exerciseSetsInput').value = '3';
    $('#exerciseRepsInput').value = '10';
    $('#exerciseWeightInput').value = '0';
    updateExerciseFields('');
    $('#exerciseFormError').hidden = true;
    $('#exerciseFormError').textContent = '';
  }

  function updateExerciseFields(name) {
    const cardio = CARDIO_EXERCISES.has(name) || (name === 'Other' && $('#category').value === 'Cardio');
    $('#exerciseSetsLabel').hidden = cardio;
    $('#repsLabelText').textContent = cardio ? 'Duration' : 'Reps';
    $('#weightLabelText').textContent = cardio ? 'Distance' : 'Weight';
    $('#weightUnit').textContent = cardio ? 'km' : 'kg';
    $('#exerciseRepsInput').value = cardio ? '20' : '10';
    $('#exerciseSetsInput').value = cardio ? '1' : '3';
    $('#exerciseFormHint').textContent = cardio ? 'Start with a comfortable duration. Distance is optional.' : 'A common starting point is 3 sets of 10 reps. Use 0 kg for bodyweight.';
    $('#exerciseTip').textContent = name ? exerciseTip(name) : 'Choose an exercise to see a simple form tip.';
    $('.exercise-numbers').classList.toggle('cardio-fields', cardio);
  }

  function closeExerciseForm() {
    $('#exerciseForm').hidden = true;
    resetExerciseForm();
  }

  function hideEditorNotice() {
    clearTimeout(inlineNoticeTimeout);
    $('#editorNotice').hidden = true;
  }

  function showEditorUndo(message, undoAction) {
    const box = $('#editorNotice');
    const button = box.querySelector('button');
    box.querySelector('span').textContent = message;
    box.hidden = false;
    button.onclick = () => {
      undoAction();
      hideEditorNotice();
    };
    clearTimeout(inlineNoticeTimeout);
    inlineNoticeTimeout = setTimeout(hideEditorNotice, 5000);
  }

  function openEditor(workoutId, date) {
    const workout = workouts.find(w => w.id === workoutId);
    $('#editorTitle').textContent = workout ? 'Edit workout' : 'New workout';
    $('#editId').value = workout?.id || '';
    $('#sessionName').value = workout?.name || '';
    $('#category').value = workout?.category || 'Strength';
    $('#sessionDate').value = workout?.date || date || today();
    $('#duration').value = workout?.duration || 45;
    $('#starterTemplates').hidden = Boolean(workout);
    editorExercises = workout ? workout.exercises.map(exercise => ({ ...exercise })) : [];
    renderEditorExercises();
    closeExerciseForm();
    hideEditorNotice();
    setFieldError('#sessionNameError', '', $('#sessionName'));
    setFieldError('#workoutExercisesError', '');
    $('#editor').showModal();
    if (!workout) $('#sessionName').focus();
  }

  function setKey(exerciseIndex, setIndex) { return `${exerciseIndex}-${setIndex}`; }
  function exerciseComplete(workout, exerciseIndex) {
    const sets = Math.max(1, Math.min(12, Number(workout.exercises[exerciseIndex]?.sets) || 1));
    return Array.from({ length: sets }, (_, setIndex) => Boolean(checks[setKey(exerciseIndex, setIndex)])).every(Boolean);
  }

  function renderRunner() {
    const workout = workouts.find(w => w.id === activeId);
    if (!workout || !workout.exercises.length) return closeRunner();
    const exercise = workout.exercises[activeExerciseIndex];
    const total = workout.exercises.length;
    const totalSets = Math.max(1, Math.min(12, Number(exercise.sets) || 1));
    $('#runnerTitle').textContent = workout.name;
    $('#runnerMeta').textContent = `${Number(workout.duration) || 0} min planned · Take it one step at a time`;
    $('#exercisePosition').textContent = `Exercise ${activeExerciseIndex + 1} of ${total}`;
    $('#runnerProgress').style.width = `${activeExerciseIndex / total * 100}%`;
    const cardio = isCardioExercise(exercise);
    $('#exerciseSets').innerHTML = `<article class="runner-exercise"><div class="runner-exercise-heading"><div><span>NOW TRAINING</span><h3>${escapeHTML(exercise.name)}</h3></div><p>${escapeHTML(exerciseTarget(exercise))}</p></div><p class="movement-tip"><strong>Form tip</strong>${escapeHTML(exerciseTip(exercise.name))}</p><fieldset class="set-checklist"><legend>${cardio ? 'Check it when you finish' : 'Check each set when you finish it'}</legend>${Array.from({ length: totalSets }, (_, setIndex) => { const key = setKey(activeExerciseIndex, setIndex); return `<label class="set-check ${checks[key] ? 'checked' : ''}"><input type="checkbox" data-set="${key}" ${checks[key] ? 'checked' : ''}><span><strong>${cardio ? 'Activity complete' : `Set ${setIndex + 1}`}</strong><small>${escapeHTML(cardio ? exerciseTarget(exercise) : `${Number(exercise.reps)} reps · ${exercise.weight}`)}</small></span><b aria-hidden="true">${checks[key] ? '✓' : ''}</b></label>`; }).join('')}</fieldset></article>`;
    $('#nextExercise').disabled = !exerciseComplete(workout, activeExerciseIndex);
    $('#nextExercise').textContent = activeExerciseIndex === total - 1 ? 'Complete workout' : 'Next exercise';
  }

  function startWorkout(workoutId) {
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;
    if (!workout.exercises.length) return notice('Add at least one exercise before starting this workout.');
    activeId = workout.id;
    checks = read(`repster-active-${activeId}`, {});
    if (!checks || typeof checks !== 'object') checks = {};
    activeExerciseIndex = workout.exercises.findIndex((_, index) => !exerciseComplete(workout, index));
    if (activeExerciseIndex < 0) activeExerciseIndex = 0;
    runnerFinished = false;
    $('.runner-tools').hidden = false;
    $('#saveForLater').hidden = false;
    $('#restClock').textContent = '01:00';
    renderRunner();
    $('#runner').showModal();
  }

  function stopRest() { if (restInterval) { clearInterval(restInterval); restInterval = null; } }
  function closeRunner() { stopRest(); $('#runner').close(); }

  function completeWorkout() {
    const workout = workouts.find(w => w.id === activeId);
    if (!workout) return;
    let volume = 0;
    let completedSets = 0;
    workout.exercises.forEach((exercise, exerciseIndex) => {
      const load = isCardioExercise(exercise) ? 0 : Number(String(exercise.weight).match(/[\d.]+/)?.[0]) || 0;
      const totalSets = Math.max(1, Math.min(12, Number(exercise.sets) || 1));
      for (let setIndex = 0; setIndex < totalSets; setIndex++) {
        if (!checks[setKey(exerciseIndex, setIndex)]) continue;
        completedSets++;
        volume += load * Number(exercise.reps || 0);
      }
    });
    workout.done = true;
    workout.completionDate = today();
    const cardioOnly = workout.exercises.every(isCardioExercise);
    history.unshift({ id: id(), workoutId: workout.id, name: workout.name, date: today(), sets: completedSets, unit: cardioOnly ? (completedSets === 1 ? 'activity' : 'activities') : 'sets', volume: cardioOnly ? 0 : Math.round(volume) });
    history = history.slice(0, 100);
    write(HISTORY_KEY, history);
    removeStored(`repster-active-${activeId}`);
    save();
    runnerFinished = true;
    $('#runnerProgress').style.width = '100%';
    $('#exercisePosition').textContent = 'Workout complete';
    $('#exerciseSets').innerHTML = `<div class="workout-complete"><span aria-hidden="true">✓</span><h3>You finished the workout.</h3><p>Your work is saved. Rest, hydrate, and return when you are ready for the next one.</p></div>`;
    $('.runner-tools').hidden = true;
    $('#saveForLater').hidden = true;
    $('#nextExercise').disabled = false;
    $('#nextExercise').textContent = 'Return to workouts';
  }

  document.body.classList.toggle('light', read(THEME_KEY, 'dark') === 'light');
  function updateThemeButton() {
    const light = document.body.classList.contains('light');
    $('#themeIcon').textContent = light ? '☾' : '☀';
    $('#themeToggle').setAttribute('aria-label', `Switch to ${light ? 'dark' : 'light'} theme`);
    $('meta[name="theme-color"]').content = light ? '#f4f4ee' : '#111411';
  }
  updateThemeButton();
  $('#themeToggle').addEventListener('click', () => { const light = document.body.classList.toggle('light'); write(THEME_KEY, light ? 'light' : 'dark'); updateThemeButton(); });
  $('#today').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  $('#addSession').addEventListener('click', () => openEditor());
  $('#heroPlan').addEventListener('click', () => openEditor());
  $('#heroStart').addEventListener('click', () => { const next = nextWorkout(); next ? startWorkout(next.id) : openEditor(); });
  $('#focusStart').addEventListener('click', () => { const next = nextWorkout(); next ? startWorkout(next.id) : openEditor(); });
  $('#weekStrip').addEventListener('click', event => { const button = event.target.closest('[data-day]'); if (button) openEditor(null, button.dataset.day); });
  $('#goalSelect').addEventListener('change', event => { write(GOAL_KEY, Number(event.target.value)); renderGoal(); });
  $('#search').addEventListener('input', renderSessions);
  document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    document.querySelectorAll('.filter').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    renderSessions();
  }));
  $('#sessionList').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-add')) return openEditor();
    if (button.dataset.start) return startWorkout(button.dataset.start);
    if (button.dataset.edit) return openEditor(button.dataset.edit);
    if (button.dataset.delete) {
      const index = workouts.findIndex(w => w.id === button.dataset.delete);
      const workout = workouts[index];
      if (!workout || !confirm(`Delete “${workout.name}”?`)) return;
      const progressKey = `repster-active-${workout.id}`;
      const savedProgress = getStored(progressKey);
      workouts.splice(index, 1);
      removeStored(progressKey);
      save();
      notice('Workout deleted.', () => {
        workouts.splice(Math.min(index, workouts.length), 0, workout);
        if (savedProgress !== null) {
          try { localStorage.setItem(progressKey, savedProgress); }
          catch { storageWarning = 'Browser storage is unavailable, so the restored set progress could not be saved.'; }
        }
        save();
        notice('Workout restored.');
      });
    }
  });
  $('#closeEditor').addEventListener('click', () => $('#editor').close());
  $('#cancelEditor').addEventListener('click', () => $('#editor').close());
  $('#showExerciseForm').addEventListener('click', () => {
    const form = $('#exerciseForm');
    form.hidden = false;
    $('#exerciseName').focus();
  });
  $('#starterTemplates').addEventListener('click', event => {
    const button = event.target.closest('[data-template]');
    if (!button) return;
    const template = STARTER_TEMPLATES[button.dataset.template];
    if (!template) return;
    $('#sessionName').value = template.name;
    $('#category').value = 'Strength';
    $('#duration').value = String(template.duration);
    editorExercises = template.exercises.map(exercise => ({ ...exercise }));
    renderEditorExercises();
    setFieldError('#sessionNameError', '', $('#sessionName'));
    setFieldError('#workoutExercisesError', '');
    notice(`${template.name} is ready. Change anything you need, then save it.`);
  });
  $('#sessionName').addEventListener('input', () => setFieldError('#sessionNameError', '', $('#sessionName')));
  $('#cancelExercise').addEventListener('click', closeExerciseForm);
  $('#plannedExercises').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.moveUp !== undefined) {
      const index = Number(button.dataset.moveUp);
      if (index > 0) [editorExercises[index - 1], editorExercises[index]] = [editorExercises[index], editorExercises[index - 1]];
      renderEditorExercises();
      return;
    }
    if (button.dataset.moveDown !== undefined) {
      const index = Number(button.dataset.moveDown);
      if (index < editorExercises.length - 1) [editorExercises[index + 1], editorExercises[index]] = [editorExercises[index], editorExercises[index + 1]];
      renderEditorExercises();
      return;
    }
    if (button.dataset.deleteExercise !== undefined) {
      const index = Number(button.dataset.deleteExercise);
      const exercise = editorExercises[index];
      if (!exercise || !confirm(`Delete “${exercise.name}”?`)) return;
      editorExercises.splice(index, 1);
      renderEditorExercises();
      showEditorUndo('Exercise deleted.', () => {
        editorExercises.splice(Math.min(index, editorExercises.length), 0, exercise);
        renderEditorExercises();
      });
    }
  });
  $('#exerciseName').addEventListener('change', event => {
    const other = event.target.value === 'Other';
    $('#customExerciseLabel').hidden = !other;
    updateExerciseFields(event.target.value);
    if (CARDIO_EXERCISES.has(event.target.value) && !editorExercises.length) $('#category').value = 'Cardio';
    if (other) $('#customExerciseName').focus();
  });
  $('#category').addEventListener('change', () => {
    if ($('#exerciseName').value === 'Other') updateExerciseFields('Other');
  });
  $('#addExercise').addEventListener('click', () => {
    const selected = $('#exerciseName').value;
    const name = selected === 'Other' ? $('#customExerciseName').value.trim() : selected;
    const error = $('#exerciseFormError');
    if (!name) {
      error.textContent = selected === 'Other' ? 'Enter an exercise name.' : 'Choose an exercise.';
      error.hidden = false;
      return;
    }
    const cardio = CARDIO_EXERCISES.has(selected) || (selected === 'Other' && $('#category').value === 'Cardio');
    const sets = cardio ? 1 : Math.max(1, Math.min(12, Number($('#exerciseSetsInput').value) || 1));
    const reps = Math.max(1, Math.min(100, Number($('#exerciseRepsInput').value) || 1));
    const weight = Math.max(0, Math.min(1000, Number($('#exerciseWeightInput').value) || 0));
    editorExercises.push({ name: name.slice(0, 80), sets, reps, weight: `${weight} ${cardio ? 'km' : 'kg'}`, mode: cardio ? 'cardio' : 'strength' });
    renderEditorExercises();
    setFieldError('#workoutExercisesError', '');
    closeExerciseForm();
    $('#showExerciseForm').focus();
  });
  $('#sessionForm').addEventListener('submit', event => {
    event.preventDefault();
    const workoutId = $('#editId').value;
    const previous = workouts.find(w => w.id === workoutId);
    const name = $('#sessionName').value.trim();
    if (!name) {
      setFieldError('#sessionNameError', 'Enter a workout name.', $('#sessionName'));
      $('#sessionName').focus();
      return;
    }
    setFieldError('#sessionNameError', '', $('#sessionName'));
    if (!editorExercises.length) {
      setFieldError('#workoutExercisesError', 'Add at least one exercise.');
      $('#showExerciseForm').focus();
      return;
    }
    setFieldError('#workoutExercisesError', '');
    if (!$('#sessionDate').value) return notice('Choose a workout date.');
    const duration = Number($('#duration').value);
    if (!Number.isFinite(duration) || duration < 5 || duration > 300) return notice('Enter a duration from 5 to 300 minutes.');
    const item = { id: previous?.id || id(), name, category: $('#category').value, date: $('#sessionDate').value, duration, done: previous?.done || false, completionDate: previous?.completionDate, exercises: editorExercises.map(exercise => ({ ...exercise })) };
    if (previous) workouts = workouts.map(w => w.id === workoutId ? item : w); else workouts.push(item);
    $('#editor').close(); save(); notice(previous ? 'Workout updated.' : 'Workout added. Let’s get to work.');
  });
  $('#closeRunner').addEventListener('click', closeRunner);
  $('#saveForLater').addEventListener('click', () => { closeRunner(); notice('Your set progress is saved for later.'); });
  $('#runner').addEventListener('close', stopRest);
  $('#exerciseSets').addEventListener('change', event => {
    const input = event.target.closest('input[data-set]');
    if (!input) return;
    checks[input.dataset.set] = input.checked;
    write(`repster-active-${activeId}`, checks);
    renderRunner();
  });
  $('#restButton').addEventListener('click', () => {
    stopRest(); let seconds = 60; $('#restClock').textContent = '01:00';
    restInterval = setInterval(() => { seconds--; $('#restClock').textContent = `00:${String(Math.max(0, seconds)).padStart(2, '0')}`; if (seconds <= 0) { stopRest(); $('#restClock').textContent = 'DONE'; notice('Rest complete. Ready for the next set.'); } }, 1000);
  });
  $('#nextExercise').addEventListener('click', () => {
    if (runnerFinished) return closeRunner();
    const workout = workouts.find(w => w.id === activeId);
    if (!workout) return;
    if (!exerciseComplete(workout, activeExerciseIndex)) return notice('Finish each set before moving on.');
    if (activeExerciseIndex === workout.exercises.length - 1) return completeWorkout();
    activeExerciseIndex++;
    renderRunner();
  });
  render();
  if (storageWarning) setTimeout(() => notice(storageWarning), 250);
})();

