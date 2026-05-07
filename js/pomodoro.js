// ─── Pomodoro ────────────────────────────────────────────────────────────────
(function () {
  const ring        = document.getElementById('pomodoroRing');
  const timeEl      = document.getElementById('pomodoroTime');
  const modeEl      = document.getElementById('pomodoroMode');
  const roundEl     = document.getElementById('pomodoroRound');
  const statusEl    = document.getElementById('pomodoroStatus');
  const startBtn    = document.getElementById('pomodoroStart');
  const startIcon   = document.getElementById('pomodoroStartIcon');
  const startLabel  = document.getElementById('pomodoroStartLabel');
  const resetBtn    = document.getElementById('pomodoroReset');
  const skipBtn     = document.getElementById('pomodoroSkip');
  const focusInput  = document.getElementById('focusMinutes');
  const goalInput   = document.getElementById('studyGoalHours');
  const goalBar     = document.getElementById('studyGoalBar');
  const goalFill    = document.getElementById('studyGoalFill');
  const goalDone    = document.getElementById('studyGoalDone');
  const goalPercent = document.getElementById('studyGoalPercent');
  const tabs        = [...document.querySelectorAll('.pomodoro-tab')];

  if (!ring || !timeEl || !startBtn) return;

  const KEY = 'startpage:pomodoro';
  const DEFAULT_FOCUS_MINUTES = 25;
  const MIN_FOCUS_MINUTES = 1;
  const MAX_FOCUS_MINUTES = 180;
  const DEFAULT_GOAL_HOURS = 8;
  const MIN_GOAL_HOURS = 0.25;
  const MAX_GOAL_HOURS = 24;
  const MAX_STUDY_SECONDS = 48 * 60 * 60;
  const MODES = {
    work:  { label: 'Focus', idle: 'Ready to focus', running: 'Focus in progress' },
    short: { label: 'Short', duration:  5 * 60, idle: 'Short break ready', running: 'Short break' },
    long:  { label: 'Long',  duration: 15 * 60, idle: 'Long break ready',  running: 'Long break' },
  };

  const state = {
    mode: 'work',
    focusMinutes: DEFAULT_FOCUS_MINUTES,
    remaining: DEFAULT_FOCUS_MINUTES * 60,
    isRunning: false,
    endAt: null,
    sessions: 0,
    status: MODES.work.idle,
    goalHours: DEFAULT_GOAL_HOURS,
    goalDate: todayKey(),
    studiedSeconds: 0,
    lastProgressAt: null,
  };

  let audioCtx = null;

  restore();

  startBtn.addEventListener('click', toggleTimer);
  resetBtn.addEventListener('click', resetTimer);
  skipBtn.addEventListener('click', () => completeCurrent({ alarm: false }));

  if (focusInput) {
    focusInput.addEventListener('input', () => {
      if (focusInput.value === '') return;
      setFocusMinutes(focusInput.value);
    });

    focusInput.addEventListener('blur', () => {
      focusInput.value = state.focusMinutes;
    });

    focusInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') focusInput.blur();
    });

    focusInput.addEventListener('wheel', e => {
      e.preventDefault();
    }, { passive: false });
  }

  if (goalInput) {
    goalInput.addEventListener('input', () => {
      if (goalInput.value === '') return;
      setGoalHours(goalInput.value);
    });

    goalInput.addEventListener('blur', () => {
      goalInput.value = formatGoalInput(state.goalHours);
    });

    goalInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') goalInput.blur();
    });

    goalInput.addEventListener('wheel', e => {
      e.preventDefault();
    }, { passive: false });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchMode(tab.dataset.mode));
  });

  document.addEventListener('pointerdown', ensureAudioReady, { once: true });
  document.addEventListener('keydown', ensureAudioReady, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tick();
  });

  window.addEventListener('beforeunload', () => {
    syncRemaining();
    save();
  });

  setInterval(tick, 250);
  if (state.remaining <= 0) completeCurrent({ alarm: state.isRunning });
  else render();

  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (!saved || !MODES[saved.mode]) return;

      state.focusMinutes = clampInteger(saved.focusMinutes, MIN_FOCUS_MINUTES, MAX_FOCUS_MINUTES, DEFAULT_FOCUS_MINUTES);
      state.mode = saved.mode;
      state.sessions = clampNumber(saved.sessions, 0, 4, 0);
      state.isRunning = Boolean(saved.isRunning);
      state.endAt = Number.isFinite(saved.endAt) ? saved.endAt : null;
      state.remaining = clampNumber(saved.remaining, 0, durationFor(state.mode), durationFor(state.mode));
      state.status = saved.status || MODES[state.mode].idle;
      state.goalHours = roundToQuarter(clampNumber(saved.goalHours, MIN_GOAL_HOURS, MAX_GOAL_HOURS, DEFAULT_GOAL_HOURS));
      state.goalDate = typeof saved.goalDate === 'string' ? saved.goalDate : todayKey();
      state.studiedSeconds = clampNumber(saved.studiedSeconds, 0, MAX_STUDY_SECONDS, 0);
      state.lastProgressAt = Number.isFinite(saved.lastProgressAt) ? saved.lastProgressAt : null;

      ensureDailyGoal();
      if (state.isRunning && state.endAt) syncRemaining();
      if (state.isRunning && state.remaining <= 0) state.status = 'Time is up';
    } catch {
      // Keep defaults if storage is unavailable or corrupted.
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Ignore storage failures and keep the timer usable.
    }
  }

  function toggleTimer() {
    if (state.isRunning) pauseTimer();
    else startTimer();
  }

  function startTimer() {
    const now = Date.now();
    ensureDailyGoal(now);
    ensureAudioReady();
    state.isRunning = true;
    state.endAt = now + state.remaining * 1000;
    state.lastProgressAt = state.mode === 'work' ? now : null;
    state.status = MODES[state.mode].running;
    render();
    save();
  }

  function pauseTimer() {
    syncRemaining();
    state.isRunning = false;
    state.endAt = null;
    state.lastProgressAt = null;
    state.status = 'Paused';
    render();
    save();
  }

  function resetTimer() {
    syncRemaining();
    state.isRunning = false;
    state.endAt = null;
    state.lastProgressAt = null;
    state.remaining = durationFor(state.mode);
    state.status = MODES[state.mode].idle;
    render();
    save();
  }

  function switchMode(mode, status) {
    if (!MODES[mode]) return;
    syncRemaining();
    state.mode = mode;
    state.remaining = durationFor(mode);
    state.isRunning = false;
    state.endAt = null;
    state.lastProgressAt = null;
    state.status = status || MODES[mode].idle;
    render();
    save();
  }

  function completeCurrent({ alarm = true } = {}) {
    const finishedMode = state.mode;
    syncRemaining();
    state.isRunning = false;
    state.endAt = null;
    state.lastProgressAt = null;

    if (alarm) playAlarm();

    if (finishedMode === 'work') {
      state.sessions = Math.min(state.sessions + 1, 4);
      switchMode(state.sessions >= 4 ? 'long' : 'short', state.sessions >= 4 ? 'Long break unlocked' : 'Take a short break');
      return;
    }

    if (finishedMode === 'long') {
      state.sessions = 0;
      switchMode('work', 'Cycle complete');
      return;
    }

    switchMode('work', 'Break over');
  }

  function tick() {
    const dateBefore = state.goalDate;
    ensureDailyGoal();

    if (!state.isRunning) {
      if (dateBefore !== state.goalDate) {
        render();
        save();
      }
      return;
    }

    syncRemaining();
    if (state.remaining <= 0) {
      completeCurrent({ alarm: true });
      return;
    }
    render();
  }

  function syncRemaining() {
    if (!state.isRunning || !state.endAt) return;

    const now = Date.now();
    ensureDailyGoal(now);
    if (state.mode === 'work') addFocusProgress(now);
    state.remaining = Math.max(0, Math.ceil((state.endAt - now) / 1000));
  }

  function addFocusProgress(now) {
    const startedAt = Number.isFinite(state.lastProgressAt) ? state.lastProgressAt : now;
    const elapsed = Math.max(0, (now - startedAt) / 1000);
    const countable = Math.min(elapsed, state.remaining);

    if (countable > 0) {
      state.studiedSeconds = clampNumber(state.studiedSeconds + countable, 0, MAX_STUDY_SECONDS, 0);
    }

    state.lastProgressAt = now;
  }

  function setFocusMinutes(value) {
    if (state.isRunning) syncRemaining();

    const minutes = clampInteger(value, MIN_FOCUS_MINUTES, MAX_FOCUS_MINUTES, state.focusMinutes);
    const changed = minutes !== state.focusMinutes;
    const wasRunningFocus = state.isRunning && state.mode === 'work';

    state.focusMinutes = minutes;

    if (state.mode === 'work' && changed) {
      const now = Date.now();
      state.remaining = durationFor('work');
      state.endAt = wasRunningFocus ? now + state.remaining * 1000 : null;
      state.lastProgressAt = wasRunningFocus ? now : null;
      state.status = wasRunningFocus ? MODES.work.running : `Focus set to ${minutes} min`;
    } else if (changed && !state.isRunning) {
      state.status = `Focus set to ${minutes} min`;
    }

    render();
    save();
  }

  function setGoalHours(value) {
    if (state.isRunning) syncRemaining();

    const hours = roundToQuarter(clampNumber(value, MIN_GOAL_HOURS, MAX_GOAL_HOURS, state.goalHours));
    const changed = hours !== state.goalHours;
    state.goalHours = hours;

    if (changed) state.status = `Goal set to ${formatGoalInput(hours)} hr`;

    render();
    save();
  }

  function durationFor(mode) {
    if (mode === 'work') return state.focusMinutes * 60;
    return MODES[mode].duration;
  }

  function render() {
    ensureDailyGoal();

    const mode = MODES[state.mode];
    const duration = durationFor(state.mode);
    const elapsed = duration - state.remaining;
    const progress = duration ? (elapsed / duration) * 360 : 0;

    ring.dataset.mode = state.mode;
    ring.style.setProperty('--progress', `${Math.max(0, Math.min(360, progress))}deg`);
    ring.setAttribute('aria-label', `${mode.label} timer, ${formatTime(state.remaining)} remaining`);

    timeEl.textContent = formatTime(state.remaining);
    modeEl.textContent = mode.label;
    roundEl.textContent = `${state.sessions}/4`;
    statusEl.textContent = state.status;
    if (focusInput && document.activeElement !== focusInput) focusInput.value = state.focusMinutes;

    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === state.mode);
    });

    startLabel.textContent = state.isRunning ? 'Pause' : 'Start';
    startBtn.title = state.isRunning ? 'Pause timer' : 'Start timer';
    startIcon.innerHTML = state.isRunning
      ? '<path d="M7 5h3v14H7V5zm7 0h3v14h-3V5z"/>'
      : '<path d="M8 5v14l11-7z"/>';

    renderGoal();
    document.title = `${formatTime(state.remaining)} - ${mode.label}`;
  }

  function renderGoal() {
    const goalSeconds = state.goalHours * 60 * 60;
    const percent = goalSeconds ? (state.studiedSeconds / goalSeconds) * 100 : 0;
    const clampedPercent = Math.max(0, Math.min(100, percent));
    const roundedPercent = Math.round(clampedPercent);
    const doneText = `${formatStudyTime(state.studiedSeconds)} / ${formatGoalInput(state.goalHours)}h`;

    if (goalInput && document.activeElement !== goalInput) goalInput.value = formatGoalInput(state.goalHours);
    if (goalFill) goalFill.style.width = `${clampedPercent}%`;
    if (goalDone) goalDone.textContent = doneText;
    if (goalPercent) goalPercent.textContent = `${Math.round(percent)}%`;
    if (goalBar) {
      goalBar.setAttribute('aria-valuenow', String(roundedPercent));
      goalBar.setAttribute('aria-valuetext', doneText);
      goalBar.setAttribute('aria-label', `Daily study goal, ${doneText}`);
    }
  }

  function playAlarm() {
    ensureAudioReady();
    if (!audioCtx) return;

    const scheduleAlarm = () => {
      const start = audioCtx.currentTime;
      const master = audioCtx.createGain();
      master.gain.setValueAtTime(0.0001, start);
      master.gain.exponentialRampToValueAtTime(0.36, start + 0.03);
      master.gain.setValueAtTime(0.36, start + 3.15);
      master.gain.exponentialRampToValueAtTime(0.0001, start + 3.35);
      master.connect(audioCtx.destination);

      for (let i = 0; i < 9; i += 1) {
        const beepStart = start + i * 0.34;
        const beepEnd = beepStart + 0.25;
        const osc = audioCtx.createOscillator();
        const gate = audioCtx.createGain();

        osc.type = i % 2 ? 'sawtooth' : 'square';
        osc.frequency.setValueAtTime(i % 2 ? 880 : 1180, beepStart);
        gate.gain.setValueAtTime(0.0001, beepStart);
        gate.gain.exponentialRampToValueAtTime(1, beepStart + 0.015);
        gate.gain.setValueAtTime(1, beepEnd - 0.04);
        gate.gain.exponentialRampToValueAtTime(0.0001, beepEnd);

        osc.connect(gate);
        gate.connect(master);
        osc.start(beepStart);
        osc.stop(beepEnd + 0.02);
      }

      window.setTimeout(() => {
        try {
          master.disconnect();
        } catch {
          // The alarm has already finished.
        }
      }, 3800);
    };

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(scheduleAlarm).catch(() => {});
      return;
    }

    scheduleAlarm();
  }

  function ensureAudioReady() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  }

  function ensureDailyGoal(now = Date.now()) {
    const today = todayKey(now);
    if (state.goalDate === today) return;

    state.goalDate = today;
    state.studiedSeconds = 0;
    state.lastProgressAt = state.isRunning && state.mode === 'work' ? now : null;
  }

  function todayKey(now = Date.now()) {
    const date = new Date(now);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function formatStudyTime(seconds) {
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours <= 0) return `${minutes}m`;
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }

  function formatGoalInput(hours) {
    return Number.isInteger(hours) ? String(hours) : String(Number(hours.toFixed(2)));
  }

  function roundToQuarter(value) {
    return Math.round(value * 4) / 4;
  }

  function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  function clampInteger(value, min, max, fallback) {
    return Math.round(clampNumber(value, min, max, fallback));
  }
})();
