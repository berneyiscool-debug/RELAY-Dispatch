// ============================================
// RELAY — THEME MANAGEMENT SYSTEM
// ============================================

export const THEMES = {
  'light': { name: 'Nordic Light (Default)', mode: 'light' },
  'dark': { name: 'Nordic Volcanic (Default)', mode: 'dark' },
  'nordic-aurora': { name: 'Nordic Aurora', mode: 'dark' },
  'neon-cyberpunk': { name: 'Neon Cyberpunk', mode: 'dark' },
  'calm-sunset': { name: 'Calm Sunset', mode: 'light' },
  'forest-mist': { name: 'Forest Mist', mode: 'light' },
  'deep-ocean': { name: 'Deep Ocean', mode: 'dark' },
  'sakura-blossom': { name: 'Sakura Blossom', mode: 'light' },
  'obsidian-gold': { name: 'Obsidian & Gold', mode: 'dark' },
  'sweet-lavender': { name: 'Sweet Lavender', mode: 'light' },
  'retro-arcade': { name: 'Retro Arcade', mode: 'dark' },
  'coffee-cream': { name: 'Coffee & Cream', mode: 'light' }
};

export function applyTheme(theme) {
  if (!THEMES[theme]) {
    theme = 'light';
  }
  
  const mode = THEMES[theme].mode;
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-theme-mode', mode);
  localStorage.setItem('simpro_theme', theme);

  // Apply visual background effects
  applyBackgroundEffects(theme);
}

function applyBackgroundEffects(theme) {
  let bgEffects = document.getElementById('theme-bg-effects');
  if (!bgEffects) {
    bgEffects = document.createElement('div');
    bgEffects.id = 'theme-bg-effects';
    document.body.prepend(bgEffects);
  }

  // Clear existing animations
  bgEffects.innerHTML = '';
  bgEffects.setAttribute('data-active-theme', theme);

  // Inject necessary elements for complex animations
  if (theme === 'retro-arcade') {
    bgEffects.innerHTML = `
      <div class="retro-grid"></div>
      <div class="retro-horizon"></div>
    `;
  } else if (theme === 'nordic-aurora') {
    let html = `
      <div class="aurora-glow"></div>
      <div class="aurora-glow-2"></div>
    `;
    // Add drifting white stars/snow
    for (let i = 0; i < 15; i++) {
      const left = Math.random() * 100;
      const size = Math.random() * 3 + 1.5; // 1.5px to 4.5px
      const duration = Math.random() * 15 + 15; // 15s to 30s
      const delay = Math.random() * -25;
      const opacity = Math.random() * 0.4 + 0.3;
      html += `<div class="aurora-star" style="left: ${left}%; width: ${size}px; height: ${size}px; animation-duration: ${duration}s; animation-delay: ${delay}s; --star-opacity: ${opacity}"></div>`;
    }
    bgEffects.innerHTML = html;
  } else if (theme === 'deep-ocean') {
    let html = `
      <div class="ocean-wave-1"></div>
      <div class="ocean-wave-2"></div>
      <div class="ocean-light-rays"></div>
    `;
    // Add rising water bubbles
    for (let i = 0; i < 15; i++) {
      const left = Math.random() * 100;
      const size = Math.random() * 8 + 4; // 4px to 12px
      const duration = Math.random() * 15 + 10; // 10s to 25s
      const delay = Math.random() * -20;
      const xDrift = Math.random() * 80 - 40; // -40px to 40px
      html += `<div class="ocean-bubble" style="left: ${left}%; width: ${size}px; height: ${size}px; animation-duration: ${duration}s; animation-delay: ${delay}s; --bubble-x-drift: ${xDrift}px;"></div>`;
    }
    bgEffects.innerHTML = html;
  } else if (theme === 'neon-cyberpunk') {
    let html = `
      <div class="cyber-grid"></div>
      <div class="cyber-glow"></div>
    `;
    // Add falling neon digital rain
    for (let i = 0; i < 20; i++) {
      const left = Math.random() * 100;
      const width = Math.random() * 1.5 + 1; // 1px to 2.5px
      const height = Math.random() * 40 + 20; // 20px to 60px line
      const duration = Math.random() * 3 + 2; // fast! 2s to 5s
      const delay = Math.random() * -5;
      const color = Math.random() > 0.5 ? '#ff007f' : '#00f0ff';
      html += `<div class="cyber-particle" style="left: ${left}%; width: ${width}px; height: ${height}px; background: linear-gradient(180deg, ${color} 0%, transparent 100%); animation-duration: ${duration}s; animation-delay: ${delay}s;"></div>`;
    }
    bgEffects.innerHTML = html;
  } else if (theme === 'forest-mist') {
    let html = `
      <div class="mist-cloud-1"></div>
      <div class="mist-cloud-2"></div>
    `;
    // Add slowly falling forest leaves
    for (let i = 0; i < 10; i++) {
      const left = Math.random() * 100;
      const size = Math.random() * 8 + 8; // 8px to 16px
      const duration = Math.random() * 18 + 12; // 12s to 30s
      const delay = Math.random() * -25;
      const colors = ['#8f9779', '#a9af90', '#c2a679', '#707a5d', '#b08d57'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      html += `<div class="forest-leaf" style="left: ${left}%; width: ${size}px; height: ${size * 1.5}px; background-color: ${color}; animation-duration: ${duration}s; animation-delay: ${delay}s;"></div>`;
    }
    bgEffects.innerHTML = html;
  } else if (theme === 'sakura-blossom') {
    let html = '';
    // Dynamic randomized cherry blossom petals
    for (let i = 0; i < 12; i++) {
      const left = Math.random() * 100;
      const size = Math.random() * 8 + 6; // 6px to 14px
      const duration = Math.random() * 15 + 10; // 10s to 25s
      const delay = Math.random() * -20;
      html += `<div class="sakura-petal" style="left: ${left}%; width: ${size}px; height: ${size * 0.7}px; animation-duration: ${duration}s; animation-delay: ${delay}s;"></div>`;
    }
    bgEffects.innerHTML = html;
  } else if (theme === 'calm-sunset') {
    let html = '';
    // Horizontal sunset breeze lines
    for (let i = 0; i < 8; i++) {
      const top = Math.random() * 80 + 10; // 10% to 90%
      const width = Math.random() * 200 + 150; // 150px to 350px
      const duration = Math.random() * 12 + 10; // 10s to 22s
      const delay = Math.random() * -15;
      const yDrift = Math.random() * 60 - 30; // -30px to 30px
      html += `<div class="breeze-line" style="top: ${top}%; width: ${width}px; animation-duration: ${duration}s; animation-delay: ${delay}s; --breeze-y-drift: ${yDrift}px;"></div>`;
    }
    bgEffects.innerHTML = html;
  } else if (theme === 'obsidian-gold') {
    let html = '';
    // Twinkling gold dust / sparkles
    for (let i = 0; i < 20; i++) {
      const left = Math.random() * 100;
      const size = Math.random() * 4 + 2; // 2px to 6px
      const duration = Math.random() * 12 + 10; // 10s to 22s
      const delay = Math.random() * -20;
      const xDrift = Math.random() * 60 - 30;
      const opacity = Math.random() * 0.4 + 0.4;
      html += `<div class="gold-sparkle" style="left: ${left}%; width: ${size}px; height: ${size}px; animation-duration: ${duration}s; animation-delay: ${delay}s; --sparkle-opacity: ${opacity}; --sparkle-x: ${xDrift}px;"></div>`;
    }
    bgEffects.innerHTML = html;
  } else if (theme === 'sweet-lavender') {
    let html = '';
    // Soft lavender petals floating down
    for (let i = 0; i < 12; i++) {
      const left = Math.random() * 100;
      const size = Math.random() * 8 + 6; // 6px to 14px
      const duration = Math.random() * 18 + 12; // 12s to 30s
      const delay = Math.random() * -25;
      html += `<div class="lavender-petal" style="left: ${left}%; width: ${size}px; height: ${size * 1.2}px; animation-duration: ${duration}s; animation-delay: ${delay}s;"></div>`;
    }
    bgEffects.innerHTML = html;
  } else if (theme === 'coffee-cream') {
    let html = '';
    // Rising cozy coffee aroma waves
    for (let i = 0; i < 8; i++) {
      const left = Math.random() * 100;
      const width = Math.random() * 30 + 20; // 20px to 50px wide wave shapes
      const height = Math.random() * 150 + 100; // 100px to 250px tall
      const duration = Math.random() * 12 + 10; // 10s to 22s
      const delay = Math.random() * -20;
      const x1 = Math.random() * 40 - 20;
      const x2 = Math.random() * 80 - 40;
      html += `<div class="steam-line" style="left: ${left}%; width: ${width}px; height: ${height}px; animation-duration: ${duration}s; animation-delay: ${delay}s; --steam-x-1: ${x1}px; --steam-x-2: ${x2}px;"></div>`;
    }
    bgEffects.innerHTML = html;
  }
}
