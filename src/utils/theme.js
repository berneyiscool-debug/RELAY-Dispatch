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
    bgEffects.innerHTML = `
      <div class="aurora-glow"></div>
      <div class="aurora-glow-2"></div>
    `;
  } else if (theme === 'deep-ocean') {
    bgEffects.innerHTML = `
      <div class="ocean-wave-1"></div>
      <div class="ocean-wave-2"></div>
      <div class="ocean-light-rays"></div>
    `;
  } else if (theme === 'neon-cyberpunk') {
    bgEffects.innerHTML = `
      <div class="cyber-grid"></div>
      <div class="cyber-glow"></div>
    `;
  } else if (theme === 'forest-mist') {
    bgEffects.innerHTML = `
      <div class="mist-cloud-1"></div>
      <div class="mist-cloud-2"></div>
    `;
  } else if (theme === 'sakura-blossom') {
    let petalsHtml = '';
    for (let i = 0; i < 6; i++) {
      petalsHtml += `<div class="sakura-petal petal-${i}"></div>`;
    }
    bgEffects.innerHTML = petalsHtml;
  }
}
