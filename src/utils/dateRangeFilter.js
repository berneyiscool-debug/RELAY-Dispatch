// ============================================
// RELAY — COMPACT DATE-RANGE FILTER
// ============================================
// One small "Date ▾" button (shows the selected range once set) that opens a
// popover with From/To inputs — replaces the two wide native date inputs in the
// list toolbars. Calls onChange(startISO, endISO) ('' when cleared).

export function createDateRangeFilter({ onChange, label = 'Date' } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'date-range-filter';
  wrap.innerHTML = `
    <button type="button" class="btn btn-secondary btn-sm date-range-trigger">
      <span class="material-icons-outlined" style="font-size:14px">calendar_today</span>
      <span class="date-range-label">${label}</span>
      <span class="material-icons-outlined" style="font-size:14px">expand_more</span>
    </button>
    <div class="date-range-pop" hidden>
      <label class="date-range-row"><span>From</span><input type="date" class="form-input" data-role="start"></label>
      <label class="date-range-row"><span>To</span><input type="date" class="form-input" data-role="end"></label>
      <button type="button" class="btn btn-ghost btn-sm date-range-clear">Clear</button>
    </div>`;

  const trigger = wrap.querySelector('.date-range-trigger');
  const pop = wrap.querySelector('.date-range-pop');
  const startI = wrap.querySelector('[data-role="start"]');
  const endI = wrap.querySelector('[data-role="end"]');
  const labelEl = wrap.querySelector('.date-range-label');
  let start = '';
  let end = '';

  const short = (d) => { if (!d) return '…'; const [, m, day] = d.split('-'); return `${day}/${m}`; };
  const refresh = () => {
    const set = !!(start || end);
    labelEl.textContent = set ? `${short(start)} – ${short(end)}` : label;
    wrap.classList.toggle('active', set);
  };
  const emit = () => { if (onChange) onChange(start, end); };

  trigger.addEventListener('click', (e) => { e.stopPropagation(); pop.hidden = !pop.hidden; });
  startI.addEventListener('change', () => { start = startI.value; refresh(); emit(); });
  endI.addEventListener('change', () => { end = endI.value; refresh(); emit(); });
  wrap.querySelector('.date-range-clear').addEventListener('click', () => {
    start = ''; end = ''; startI.value = ''; endI.value = ''; refresh(); emit(); pop.hidden = true;
  });
  document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) pop.hidden = true; });

  return wrap;
}
