// Bulk rebrand script generated to replace all SimPRO / FieldForge references with RELAY branding
const fs = require('fs');
const path = require('path');

const replacements = [
  // Prefixes
  { old: 'simpro_', new: 'relay_' },
  { old: 'simpro__', new: 'relay__' },
  // Settings event
  { old: 'simpro-settings-updated', new: 'relay-settings-updated' },
  // Theme
  { old: 'simpro_theme', new: 'relay_theme' },
  // Logout event
  { old: "'fieldforge-logout'", new: "'relay-logout'" },
  { old: "fieldforge-logout", new: "relay-logout" },
  // Email domain
  { old: "fieldforge.internal", new: "relay.internal" },
  { old: "${companySlug}.fieldforge.internal", new: "${companySlug}.relay.internal" },
  // CSV filenames
  { old: "`fieldforge_invoices_sync_${Date.now()}.csv`", new: "`relay_invoices_sync_${Date.now()}.csv`" },
  { old: "`simpro_${activeReport}_report.csv`", new: "`relay_${activeReport}_report.csv`" },
  { old: "`FieldForge_Selected_Timesheets_${dateLabel}.csv`", new: "`relay_selected_timesheets_${dateLabel}.csv`" },
  { old: "`FieldForge_Approved_Timesheets_${dateLabel}.csv`", new: "`relay_approved_timesheets_${dateLabel}.csv`" },
  // General name changes
  { old: 'FieldForge', new: 'RELAY' },
  { old: 'fieldforge', new: 'relay' },
  { old: 'SimPRO', new: 'RELAY' },
  { old: 'simpro', new: 'relay' }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  replacements.forEach(r => {
    const pattern = new RegExp(r.old.replace(/[-/\\^$*+?.()|[\\]{}]/g, '\\$&'), 'g');
    content = content.replace(pattern, r.new);
  });
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git', 'scratch', 'public', 'docs'].includes(entry.name)) continue;
      walk(fullPath);
    } else if (fullPath.match(/\.(js|json|ts|toml|conf|xml|svg|css|html|jsx|tsx)$/)) {
      processFile(fullPath);
    }
  }
}

walk(__dirname);
console.log('Rebranding complete');
