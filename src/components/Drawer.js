export function showDrawer({ title, content, actions = [], width = 400 }) {
  const existing = document.querySelector('.drawer-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'drawer-overlay';

  const drawer = document.createElement('div');
  drawer.className = 'drawer';
  drawer.style.width = typeof width === 'number' ? `${width}px` : width;

  const header = document.createElement('div');
  header.className = 'drawer-header';
  header.innerHTML = `
    <h3>${title}</h3>
    <button class="drawer-close"><span class="material-icons-outlined">close</span></button>
  `;

  const body = document.createElement('div');
  body.className = 'drawer-body';
  if (typeof content === 'string') {
    body.innerHTML = content;
  } else {
    body.appendChild(content);
  }

  drawer.appendChild(header);
  drawer.appendChild(body);

  if (actions.length > 0) {
    const footer = document.createElement('div');
    footer.className = 'drawer-footer';
    actions.forEach(act => {
      const btn = document.createElement('button');
      btn.className = `btn ${act.className || 'btn-secondary'}`;
      btn.innerHTML = act.label;
      btn.onclick = () => act.onClick(closeDrawer);
      footer.appendChild(btn);
    });
    drawer.appendChild(footer);
  }

  overlay.appendChild(drawer);
  document.body.appendChild(overlay);

  function closeDrawer() {
    drawer.style.animation = 'slideRightOut 0.2s ease forwards';
    overlay.style.animation = 'fadeOut 0.2s ease forwards';
    setTimeout(() => overlay.remove(), 200);
  }

  header.querySelector('.drawer-close').onclick = closeDrawer;
  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) closeDrawer();
  });
}
