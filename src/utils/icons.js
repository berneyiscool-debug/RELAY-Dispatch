// ============================================
// RELAY — LUCIDE ICON SHIM
// ============================================
// The app renders icons as <span class="material-icons-outlined">name</span>
// (hundreds of call sites, many with dynamic names). Rather than hand-editing
// every one, this shim swaps each Material glyph for the matching Lucide SVG at
// runtime — covering static markup and anything rendered later (via a
// MutationObserver). Anything unmapped is left as its Material glyph, so nothing
// ever breaks. Icons inherit size from font-size (1em) and colour (currentColor).

import { icons as LUCIDE } from 'lucide';

// Material Icons (Outlined) name  →  Lucide PascalCase key.
const MAP = {
  ac_unit: 'Snowflake',
  account_balance_wallet: 'Wallet',
  account_circle: 'CircleUser',
  account_tree: 'Network',
  add: 'Plus',
  add_circle: 'CirclePlus',
  add_circle_outline: 'CirclePlus',
  add_shopping_cart: 'ShoppingCart',
  add_task: 'ListPlus',
  admin_panel_settings: 'ShieldCheck',
  align_horizontal_right: 'AlignRight',
  analytics: 'ChartColumn',
  archive: 'Archive',
  arrow_back: 'ArrowLeft',
  arrow_drop_down_circle: 'CircleChevronDown',
  arrow_forward: 'ArrowRight',
  arrow_upward: 'ArrowUp',
  article: 'FileText',
  assignment: 'ClipboardList',
  assignment_ind: 'ClipboardCheck',
  assignment_turned_in: 'ClipboardCheck',
  attach_file: 'Paperclip',
  attachment: 'Paperclip',
  auto_awesome: 'Sparkles',
  auto_fix_high: 'WandSparkles',
  autorenew: 'RefreshCw',
  backup: 'Save',
  badge: 'IdCard',
  bar_chart: 'ChartColumn',
  block: 'Ban',
  bolt: 'Zap',
  bookmark_add: 'BookmarkPlus',
  build: 'Wrench',
  business: 'Building2',
  business_center: 'Briefcase',
  calendar_month: 'Calendar',
  calendar_today: 'Calendar',
  campaign: 'Megaphone',
  cancel: 'CircleX',
  category: 'Shapes',
  center_focus_strong: 'Focus',
  chat: 'MessageSquare',
  check: 'Check',
  check_box: 'SquareCheck',
  check_circle: 'CircleCheck',
  chevron_left: 'ChevronLeft',
  chevron_right: 'ChevronRight',
  circle: 'Circle',
  cleaning_services: 'SprayCan',
  clear_day: 'Sun',
  close: 'X',
  close_fullscreen: 'Shrink',
  cloud: 'Cloud',
  cloud_done: 'Cloud',
  cloud_off: 'CloudOff',
  cloud_queue: 'Cloud',
  cloud_upload: 'CloudUpload',
  code: 'Code',
  colorize: 'Pipette',
  computer: 'Monitor',
  construction: 'Construction',
  content_copy: 'Copy',
  credit_card: 'CreditCard',
  dashboard: 'LayoutDashboard',
  dashboard_customize: 'LayoutDashboard',
  data_object: 'Braces',
  delete: 'Trash2',
  delete_forever: 'Trash2',
  delete_outline: 'Trash',
  delete_sweep: 'Eraser',
  description: 'FileText',
  directions: 'Navigation',
  directions_car: 'Car',
  done: 'Check',
  done_all: 'CheckCheck',
  download: 'Download',
  drafts: 'MailOpen',
  drag_indicator: 'GripVertical',
  draw: 'Pencil',
  edit: 'Pencil',
  edit_document: 'FilePen',
  email: 'Mail',
  emoji_events: 'Trophy',
  engineering: 'HardHat',
  error: 'CircleAlert',
  error_outline: 'CircleAlert',
  event_busy: 'CalendarX',
  event_repeat: 'CalendarClock',
  expand_more: 'ChevronDown',
  file_upload: 'Upload',
  flight_takeoff: 'PlaneTakeoff',
  foggy: 'CloudFog',
  folder: 'Folder',
  folder_copy: 'Folders',
  folder_off: 'FolderX',
  folder_open: 'FolderOpen',
  forum: 'MessagesSquare',
  gavel: 'Gavel',
  gpp_good: 'ShieldCheck',
  gpp_maybe: 'ShieldAlert',
  groups: 'Users',
  handyman: 'Wrench',
  help: 'CircleHelp',
  help_outline: 'CircleHelp',
  history: 'History',
  history_edu: 'ScrollText',
  home: 'House',
  hourglass_empty: 'Hourglass',
  image: 'Image',
  inbox: 'Inbox',
  info: 'Info',
  insert_drive_file: 'File',
  insights: 'Lightbulb',
  inventory: 'Package',
  inventory_2: 'Package',
  key: 'Key',
  keyboard_arrow_down: 'ChevronDown',
  keyboard_arrow_up: 'ChevronUp',
  label: 'Tag',
  lan: 'Network',
  library_add: 'CopyPlus',
  link: 'Link',
  link_off: 'Unlink',
  local_fire_department: 'Flame',
  local_shipping: 'Truck',
  location_on: 'MapPin',
  lock: 'Lock',
  lock_clock: 'Lock',
  lock_open: 'LockOpen',
  lock_reset: 'KeyRound',
  login: 'LogIn',
  logout: 'LogOut',
  mail: 'Mail',
  mail_outline: 'Mail',
  merge: 'GitMerge',
  monetization_on: 'CircleDollarSign',
  more_horiz: 'Ellipsis',
  more_vert: 'EllipsisVertical',
  notes: 'StickyNote',
  notifications: 'Bell',
  notifications_active: 'BellRing',
  notifications_off: 'BellOff',
  offline_bolt: 'Zap',
  open_in_browser: 'ExternalLink',
  open_in_full: 'Expand',
  open_in_new: 'ExternalLink',
  partly_cloudy_day: 'CloudSun',
  payment: 'CreditCard',
  payments: 'Banknote',
  pending_actions: 'Hourglass',
  people: 'Users',
  person: 'User',
  person_add: 'UserPlus',
  person_off: 'UserX',
  phone: 'Phone',
  photo_camera: 'Camera',
  photo_library: 'Images',
  picture_as_pdf: 'FileText',
  place: 'MapPin',
  playlist_add_check: 'ListChecks',
  post_add: 'FilePlus',
  precision_manufacturing: 'Factory',
  price_check: 'BadgeCheck',
  print: 'Printer',
  psychology: 'Brain',
  radio_button_unchecked: 'Circle',
  rainy: 'CloudRain',
  rate_review: 'MessageSquare',
  receipt: 'Receipt',
  receipt_long: 'ReceiptText',
  refresh: 'RefreshCw',
  remove: 'Minus',
  repeat: 'Repeat',
  reply: 'Reply',
  request_quote: 'FileText',
  route: 'Route',
  save: 'Save',
  schedule: 'Clock',
  science: 'FlaskConical',
  search: 'Search',
  search_off: 'SearchX',
  security: 'ShieldCheck',
  sell: 'Tag',
  send: 'Send',
  settings: 'Settings',
  settings_suggest: 'Settings2',
  shield: 'Shield',
  shopping_cart: 'ShoppingCart',
  space_bar: 'Space',
  space_dashboard: 'LayoutDashboard',
  speed: 'Gauge',
  storage: 'Database',
  subdirectory_arrow_right: 'CornerDownRight',
  support_agent: 'Headset',
  swap_horiz: 'ArrowLeftRight',
  sync: 'RefreshCw',
  sync_alt: 'ArrowRightLeft',
  table_view: 'Table',
  task_alt: 'CircleCheckBig',
  tablet_mac: 'Tablet',
  thunderstorm: 'CloudLightning',
  timer: 'Timer',
  today: 'CalendarDays',
  trending_up: 'TrendingUp',
  tune: 'SlidersHorizontal',
  undo: 'Undo2',
  upload: 'Upload',
  upload_file: 'Upload',
  view_list: 'List',
  visibility: 'Eye',
  vpn_key: 'KeyRound',
  warning: 'TriangleAlert',
  warning_amber: 'TriangleAlert',
  wb_sunny: 'Sun',
  web_asset: 'AppWindow',
  widgets: 'LayoutGrid',
  work: 'Briefcase',
  work_off: 'Briefcase',
  // Previously unmapped Material names (rendered as Material glyphs next to Lucide SVGs)
  account_balance: 'Landmark',
  add_comment: 'MessageSquarePlus',
  card_giftcard: 'Gift',
  checklist: 'ListChecks',
  contact_mail: 'Contact',
  domain: 'Building',
  event: 'CalendarDays',
  event_seat: 'Armchair',
  file_copy: 'Copy',
  flag: 'Flag',
  grid_view: 'LayoutGrid',
  group: 'Users',
  health_and_safety: 'ShieldPlus',
  hub: 'Network',
  keyboard_double_arrow_right: 'ChevronsRight',
  map: 'Map',
  mark_email_read: 'MailCheck',
  memory: 'MemoryStick',
  menu_book: 'BookOpen',
  percent: 'Percent',
  person_outline: 'User',
  pie_chart: 'ChartPie',
  qr_code_2: 'QrCode',
  shopping_bag: 'ShoppingBag',
  sticky_note_2: 'StickyNote',
  store: 'Store',
  unfold_more: 'ChevronsUpDown',
  update: 'RefreshCcw',
  waving_hand: 'Hand',
  web: 'Globe',
  work_history: 'BriefcaseBusiness',
  // Dynamically-assigned icons (set via ternaries / textContent, missed by the static scan)
  dark_mode: 'Moon',
  light_mode: 'Sun',
  arrow_downward: 'ArrowDown',
  arrow_drop_down: 'ChevronDown',
  chat_bubble_outline: 'MessageCircle',
  edit_note: 'SquarePen',
  expand_less: 'ChevronUp',
  fact_check: 'ClipboardCheck',
  info_outline: 'Info',
  keyboard_arrow_right: 'ChevronRight',
  lock_outline: 'Lock',
  pause: 'Pause',
  play_arrow: 'Play',
  pending: 'CircleEllipsis',
  star: 'Star',
  star_outline: 'Star',
  trending_down: 'TrendingDown',
  verified: 'BadgeCheck',
  visibility_off: 'EyeOff',
  warehouse: 'Warehouse',
};

const svgCache = new Map();

function svgFor(lucideName) {
  if (svgCache.has(lucideName)) return svgCache.get(lucideName);
  const node = LUCIDE[lucideName];
  if (!node) { svgCache.set(lucideName, ''); return ''; }
  const children = node
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')} />`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="licon-svg">${children}</svg>`;
  svgCache.set(lucideName, svg);
  return svg;
}

function convert(el) {
  // Idempotent + text-change aware: acts whenever the span holds a mappable
  // Material name. After conversion the span has an <svg> and no text, so a
  // re-scan is a no-op — until code sets textContent again (e.g. logout swaps
  // logout↔warning, theme swaps dark_mode↔light_mode), which we then re-convert.
  const name = (el.textContent || '').trim();
  if (!name) return;                 // already an svg, or empty
  const lucideName = MAP[name];
  if (!lucideName) return;           // leave unmapped Material glyph intact
  if (el.dataset.licon === name && el.firstElementChild) return; // already correct
  const svg = svgFor(lucideName);
  if (!svg) return;
  el.dataset.licon = name;
  el.innerHTML = svg;
  el.classList.add('licon');
}

function isIcon(n) {
  return n && n.nodeType === 1 && n.classList && n.classList.contains('material-icons-outlined');
}

export function applyLucideIcons(root) {
  const r = root || document;
  if (r.classList && r.classList.contains('material-icons-outlined')) convert(r);
  r.querySelectorAll && r.querySelectorAll('.material-icons-outlined').forEach(convert);
}

export function initLucideIcons() {
  applyLucideIcons(document);
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      // New element subtrees.
      m.addedNodes && m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        if (isIcon(n)) convert(n);
        n.querySelectorAll && n.querySelectorAll('.material-icons-outlined').forEach(convert);
      });
      // Icon text set directly (childList on the span, or characterData on its text node).
      if (isIcon(m.target)) convert(m.target);
      else if (m.type === 'characterData' && isIcon(m.target && m.target.parentNode)) convert(m.target.parentNode);
    }
  });
  mo.observe(document.body, { childList: true, subtree: true, characterData: true });
}
