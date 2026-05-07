// ─── Clock ────────────────────────────────────────────────────────────────────
(function () {
  const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  const DAYS = [
    'Sunday','Monday','Tuesday','Wednesday',
    'Thursday','Friday','Saturday',
  ];

  const elTime = document.getElementById('clock');
  const elDate = document.getElementById('clock-date');
  const elDay  = document.getElementById('clock-day');

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const now = new Date();
    const hours = now.getHours();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;

    elTime.textContent = `${displayHour}:${pad(now.getMinutes())} ${period}`;
    elDate.textContent = `${now.getDate()} ${MONTHS[now.getMonth()]}`;
    elDay.textContent  = DAYS[now.getDay()];
  }

  tick();
  setInterval(tick, 1000);
})();
