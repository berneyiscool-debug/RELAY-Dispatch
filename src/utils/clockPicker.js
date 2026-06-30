import { store } from '../data/store.js';

export function initClockPicker(inputEl) {
  if (!inputEl || inputEl.classList.contains('clock-picker-initialized')) return;
  inputEl.classList.add('clock-picker-initialized');

  // Hide original datetime-local input
  inputEl.style.display = 'none';

  // Create wrapper container and replacement fields
  const container = document.createElement('div');
  container.className = 'clock-picker-container';
  inputEl.parentNode.insertBefore(container, inputEl);

  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.className = 'form-input';
  dateInput.style.flex = '1';

  const timeInput = document.createElement('input');
  timeInput.type = 'text';
  timeInput.className = 'form-input';
  timeInput.style.flex = '1';
  timeInput.readOnly = true;
  timeInput.style.cursor = 'pointer';
  timeInput.placeholder = 'Select time';

  container.appendChild(dateInput);
  container.appendChild(timeInput);

  // Initialize values
  const updateFromSource = () => {
    const val = inputEl.value || '';
    if (val.includes('T')) {
      const [d, t] = val.split('T');
      dateInput.value = d;
      timeInput.value = formatTo12H(t);
    } else {
      dateInput.value = '';
      timeInput.value = '';
    }
  };

  updateFromSource();

  // Watch for programmatical updates to source input (e.g. from template/defaults)
  const observer = new MutationObserver(() => updateFromSource());
  observer.observe(inputEl, { attributes: true, attributeFilter: ['value'] });

  const updateSource = () => {
    if (dateInput.value && timeInput.value) {
      const t24 = formatTo24H(timeInput.value);
      inputEl.value = `${dateInput.value}T${t24}`;
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      inputEl.value = '';
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  dateInput.addEventListener('change', updateSource);

  // Toggle dropdown / popup
  timeInput.addEventListener('click', (e) => {
    e.stopPropagation();
    openClockPopup(timeInput, (selectedTime) => {
      timeInput.value = selectedTime;
      updateSource();
    });
  });
}

function formatTo12H(t24) {
  if (!t24) return '';
  const [hStr, mStr] = t24.split(':');
  let h = parseInt(hStr);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h.toString().padStart(2, '0')}:${mStr} ${ampm}`;
}

function formatTo24H(t12) {
  if (!t12) return '00:00';
  const [time, ampm] = t12.split(' ');
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr);
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${mStr}`;
}

function openClockPopup(anchorEl, onSelect) {
  closeAllClockPickers();

  const popup = document.createElement('div');
  popup.className = 'clock-picker-popup';
  document.body.appendChild(popup);

  // Position popup directly below input
  const rect = anchorEl.getBoundingClientRect();
  const top = rect.bottom + window.scrollY;
  const left = rect.left + window.scrollX;
  popup.style.top = `${top + 4}px`;
  popup.style.left = `${left}px`;

  // Determine current time to initialize
  let currentHour = 9;
  let currentMinute = 0;
  let currentAMPM = 'AM';

  if (anchorEl.value) {
    const match = anchorEl.value.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      currentHour = parseInt(match[1]);
      currentMinute = parseInt(match[2]);
      currentAMPM = match[3].toUpperCase();
    }
  }

  let activeView = 'hour'; // 'hour' or 'minute'

  const renderHeader = () => {
    const header = popup.querySelector('.clock-picker-header-time');
    if (!header) return;
    header.innerHTML = `
      <span class="${activeView === 'hour' ? 'active' : ''}" id="cp-btn-hour" style="cursor:pointer; padding:2px 6px; border-radius:4px;">${currentHour.toString().padStart(2, '0')}</span>:<span class="${activeView === 'minute' ? 'active' : ''}" id="cp-btn-minute" style="cursor:pointer; padding:2px 6px; border-radius:4px;">${currentMinute.toString().padStart(2, '0')}</span>
      <span style="font-size:16px; margin-left:6px; color:var(--text-tertiary);" id="cp-lbl-ampm">${currentAMPM}</span>
    `;

    popup.querySelector('#cp-btn-hour').addEventListener('click', (e) => {
      e.stopPropagation();
      activeView = 'hour';
      renderBody();
    });
    popup.querySelector('#cp-btn-minute').addEventListener('click', (e) => {
      e.stopPropagation();
      activeView = 'minute';
      renderBody();
    });
  };

  const renderBody = () => {
    renderHeader();
    const face = popup.querySelector('.clock-picker-face');
    if (!face) return;
    
    // Clear old numbers
    face.querySelectorAll('.clock-number').forEach(n => n.remove());

    // Update hand position
    const hand = face.querySelector('.clock-picker-hand');

    const radius = 55; // px
    if (activeView === 'hour') {
      const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      hours.forEach((h, i) => {
        const num = document.createElement('div');
        num.className = `clock-number ${currentHour === h ? 'active' : ''}`;
        num.textContent = h;
        face.appendChild(num);

        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        num.style.transform = `translate(${x}px, ${y}px)`;

        num.addEventListener('click', (ev) => {
          ev.stopPropagation();
          currentHour = h;
          activeView = 'minute';
          renderBody();
        });
      });

      const hIndex = hours.indexOf(currentHour);
      const degrees = hIndex * 30;
      if (hand) hand.style.transform = `rotate(${degrees}deg)`;
    } else {
      const settings = store.getSettings();
      const rounding = settings.laborRounding || 15;

      let validMinutes = [];
      if (rounding === 60) {
        validMinutes = [0];
      } else if (rounding === 30) {
        validMinutes = [0, 30];
      } else if (rounding === 15) {
        validMinutes = [0, 15, 30, 45];
      } else if (rounding === 5) {
        validMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
      } else {
        // Precise / 1-minute
        validMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
      }

      if (rounding > 1) {
        currentMinute = Math.round(currentMinute / rounding) * rounding % 60;
      }

      validMinutes.forEach((m) => {
        const num = document.createElement('div');
        num.className = `clock-number ${currentMinute === m ? 'active' : ''}`;
        num.textContent = m.toString().padStart(2, '0');
        face.appendChild(num);

        const angle = ((m / 60) * 360 - 90) * (Math.PI / 180);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        num.style.transform = `translate(${x}px, ${y}px)`;

        num.addEventListener('click', (ev) => {
          ev.stopPropagation();
          currentMinute = m;
          renderHeader();
          const degrees = (m / 60) * 360;
          if (hand) hand.style.transform = `rotate(${degrees}deg)`;
          face.querySelectorAll('.clock-number').forEach(cn => cn.classList.remove('active'));
          num.classList.add('active');
        });
      });

      const degrees = (currentMinute / 60) * 360;
      if (hand) hand.style.transform = `rotate(${degrees}deg)`;
    }
  };

  popup.innerHTML = `
    <div class="clock-picker-left-panel">
      <div class="clock-picker-face-container" style="margin-bottom:0;">
        <div class="clock-picker-face">
          <div class="clock-picker-center"></div>
          <div class="clock-picker-hand"></div>
        </div>
      </div>
    </div>
    <div class="clock-picker-right-panel" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;">
      <div class="clock-picker-header" style="margin-bottom:0; justify-content:center;">
        <div class="clock-picker-header-time"></div>
      </div>
      <div class="clock-picker-ampm-toggle" style="margin-bottom:0;">
        <button type="button" class="ampm-btn ${currentAMPM === 'AM' ? 'active' : ''}" data-ampm="AM">AM</button>
        <button type="button" class="ampm-btn ${currentAMPM === 'PM' ? 'active' : ''}" data-ampm="PM">PM</button>
      </div>
      <div class="clock-picker-actions" style="border-top:none; padding-top:0; justify-content:center; gap:6px; width:100%;">
        <button type="button" class="btn btn-ghost btn-sm clock-picker-cancel" style="padding:2px 6px; font-size:10px; min-height:24px; font-weight:600;">Cancel</button>
        <button type="button" class="btn btn-primary btn-sm clock-picker-ok" style="padding:2px 6px; font-size:10px; min-height:24px; font-weight:600;">OK</button>
      </div>
    </div>
  `;

  // Bind AM/PM buttons
  popup.querySelectorAll('.ampm-btn').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      popup.querySelectorAll('.ampm-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentAMPM = btn.dataset.ampm;
      renderHeader();
    });
  });

  // Bind Actions
  popup.querySelector('.clock-picker-cancel').addEventListener('click', (ev) => {
    ev.stopPropagation();
    closeAllClockPickers();
  });

  popup.querySelector('.clock-picker-ok').addEventListener('click', (ev) => {
    ev.stopPropagation();
    const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')} ${currentAMPM}`;
    onSelect(timeStr);
    closeAllClockPickers();
  });

  renderBody();

  const onOutsideClick = (event) => {
    if (!popup.contains(event.target) && event.target !== anchorEl) {
      closeAllClockPickers();
    }
  };

  document.addEventListener('click', onOutsideClick);
  popup._cleanup = () => {
    document.removeEventListener('click', onOutsideClick);
  };
}

export function closeAllClockPickers() {
  document.querySelectorAll('.clock-picker-popup').forEach(p => {
    if (p._cleanup) p._cleanup();
    p.remove();
  });
}
