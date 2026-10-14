// The Activity tab on the lead detail page writes an `activityLog` array onto
// the lead record, so the shape of an entry and every derived value the feed
// renders (sort order, collapse threshold, avatar initials, attachment size)
// are pinned here. These helpers are pure, so the whole feed contract is
// testable without a DOM.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIVITY_PREVIEW_LENGTH,
  ACTIVITY_PREVIEW_IMAGES,
  normalizeLeadActivityLog,
  buildLeadActivityEntry,
  addLeadActivityEntry,
  removeLeadActivityEntry,
  shouldCollapseLeadActivity,
  isLeadActivityImage,
  leadActivityFileSize,
  leadActivityInitials,
} from './leadActivity.js';

const entry = (overrides = {}) => ({
  id: 'a1',
  content: 'Called the customer',
  files: [],
  date: '2026-10-01T02:00:00.000Z',
  author: 'Josh Preview',
  ...overrides,
});

test('normalizeLeadActivityLog returns an empty array for non-arrays', () => {
  assert.deepEqual(normalizeLeadActivityLog(undefined), []);
  assert.deepEqual(normalizeLeadActivityLog(null), []);
  assert.deepEqual(normalizeLeadActivityLog('nope'), []);
  assert.deepEqual(normalizeLeadActivityLog({ id: 'a1' }), []);
});

test('normalizeLeadActivityLog drops non-object members', () => {
  const log = ['a string', null, 42, entry()];
  assert.strictEqual(normalizeLeadActivityLog(log).length, 1);
});

test('normalizeLeadActivityLog fills every missing field with a safe default', () => {
  const [result] = normalizeLeadActivityLog([{}]);
  assert.strictEqual(result.content, '');
  assert.deepEqual(result.files, []);
  assert.strictEqual(result.date, '');
  assert.strictEqual(result.author, 'Unknown User');
  assert.ok(result.id.length > 0, 'a missing id must still be addressable for delete');
});

test('normalizeLeadActivityLog coerces wrong types instead of throwing', () => {
  const [result] = normalizeLeadActivityLog([{ id: 7, content: 5, files: 'x', date: 9, author: 3 }]);
  assert.strictEqual(result.content, '');
  assert.deepEqual(result.files, []);
  assert.strictEqual(result.date, '');
  assert.strictEqual(result.author, 'Unknown User');
  assert.strictEqual(typeof result.id, 'string');
});

test('normalizeLeadActivityLog keeps only real file objects', () => {
  const [result] = normalizeLeadActivityLog([entry({ files: [{ name: 'a.png', data: 'data:,' }, null, 'x'] })]);
  assert.strictEqual(result.files.length, 1);
  assert.strictEqual(result.files[0].name, 'a.png');
});

test('normalizeLeadActivityLog sorts newest first', () => {
  const log = [
    entry({ id: 'old', date: '2026-09-01T00:00:00.000Z' }),
    entry({ id: 'new', date: '2026-10-01T00:00:00.000Z' }),
    entry({ id: 'mid', date: '2026-09-15T00:00:00.000Z' }),
  ];
  assert.deepEqual(normalizeLeadActivityLog(log).map((e) => e.id), ['new', 'mid', 'old']);
});

test('normalizeLeadActivityLog sorts entries with an unusable date last without producing NaN', () => {
  const log = [
    entry({ id: 'undated', date: '' }),
    entry({ id: 'dated', date: '2026-10-01T00:00:00.000Z' }),
  ];
  assert.deepEqual(normalizeLeadActivityLog(log).map((e) => e.id), ['dated', 'undated']);
});

test('normalizeLeadActivityLog does not mutate the input', () => {
  const log = [entry({ id: '' }), entry({ id: 'b' })];
  const snapshot = JSON.stringify(log);
  normalizeLeadActivityLog(log);
  assert.strictEqual(JSON.stringify(log), snapshot);
});

test('buildLeadActivityEntry trims the posted textarea value', () => {
  const built = buildLeadActivityEntry({ content: '  Site visit booked  ' });
  assert.strictEqual(built.content, 'Site visit booked');
});

test('buildLeadActivityEntry defaults the author and stamps a date', () => {
  const built = buildLeadActivityEntry({ content: 'x' });
  assert.strictEqual(built.author, 'Unknown User');
  assert.ok(!Number.isNaN(new Date(built.date).getTime()), 'date must be parseable');
  assert.ok(built.id.length > 0);
});

test('buildLeadActivityEntry honours an injected id and date', () => {
  const built = buildLeadActivityEntry({ content: 'x', author: 'Josh Preview', files: [{ name: 'a.png' }] }, { id: 'fixed', date: '2026-10-02T00:00:00.000Z' });
  assert.strictEqual(built.id, 'fixed');
  assert.strictEqual(built.date, '2026-10-02T00:00:00.000Z');
  assert.strictEqual(built.author, 'Josh Preview');
  assert.strictEqual(built.files.length, 1);
});

test('buildLeadActivityEntry copies the staged files array', () => {
  const files = [{ name: 'a.png' }];
  const built = buildLeadActivityEntry({ content: 'x', files });
  built.files.push({ name: 'b.png' });
  assert.strictEqual(files.length, 1, 'the composer must be able to clear its staging array independently');
});

test('addLeadActivityEntry prepends the new entry', () => {
  const log = addLeadActivityEntry([entry({ id: 'older' })], entry({ id: 'newer' }));
  assert.deepEqual(log.map((e) => e.id), ['newer', 'older']);
});

test('addLeadActivityEntry tolerates a missing log and ignores junk entries', () => {
  assert.deepEqual(addLeadActivityEntry(undefined, entry({ id: 'only' })).map((e) => e.id), ['only']);
  assert.deepEqual(addLeadActivityEntry([entry()], null).map((e) => e.id), ['a1']);
});

test('removeLeadActivityEntry removes exactly the matching id', () => {
  const log = [entry({ id: 'a' }), entry({ id: 'b' }), entry({ id: 'c' })];
  assert.deepEqual(removeLeadActivityEntry(log, 'b').map((e) => e.id), ['a', 'c']);
});

test('removeLeadActivityEntry with an unknown id leaves the log intact', () => {
  const log = [entry({ id: 'a' })];
  assert.deepEqual(removeLeadActivityEntry(log, 'nope').map((e) => e.id), ['a']);
  assert.deepEqual(removeLeadActivityEntry(log, undefined).map((e) => e.id), ['a']);
});

test('removeLeadActivityEntry of the last entry yields an empty array for the empty state', () => {
  assert.deepEqual(removeLeadActivityEntry([entry({ id: 'a' })], 'a'), []);
});

test('shouldCollapseLeadActivity is false for a short entry with no files', () => {
  assert.strictEqual(shouldCollapseLeadActivity(entry()), false);
  assert.strictEqual(shouldCollapseLeadActivity(undefined), false);
});

test('shouldCollapseLeadActivity triggers past the content threshold, not at it', () => {
  assert.strictEqual(shouldCollapseLeadActivity(entry({ content: 'x'.repeat(ACTIVITY_PREVIEW_LENGTH) })), false);
  assert.strictEqual(shouldCollapseLeadActivity(entry({ content: 'x'.repeat(ACTIVITY_PREVIEW_LENGTH + 1) })), true);
});

test('shouldCollapseLeadActivity triggers on a long attachment list', () => {
  const file = { name: 'a.png' };
  assert.strictEqual(shouldCollapseLeadActivity(entry({ files: new Array(ACTIVITY_PREVIEW_IMAGES).fill(file) })), false);
  assert.strictEqual(shouldCollapseLeadActivity(entry({ files: new Array(ACTIVITY_PREVIEW_IMAGES + 1).fill(file) })), true);
});

test('isLeadActivityImage only accepts image mime types', () => {
  assert.strictEqual(isLeadActivityImage({ type: 'image/png' }), true);
  assert.strictEqual(isLeadActivityImage({ type: 'image/svg+xml' }), true);
  assert.strictEqual(isLeadActivityImage({ type: 'application/pdf' }), false);
  assert.strictEqual(isLeadActivityImage({ name: 'a.png' }), false);
  assert.strictEqual(isLeadActivityImage(null), false);
});

test('leadActivityFileSize scales and never renders NaN', () => {
  assert.strictEqual(leadActivityFileSize(512), '512 B');
  assert.strictEqual(leadActivityFileSize(2048), '2.0 KB');
  assert.strictEqual(leadActivityFileSize(3 * 1024 * 1024), '3.0 MB');
  assert.strictEqual(leadActivityFileSize(0), '0 B');
  assert.strictEqual(leadActivityFileSize(undefined), '0 B');
  assert.strictEqual(leadActivityFileSize('abc'), '0 B');
});

test('leadActivityInitials uses up to two words', () => {
  assert.strictEqual(leadActivityInitials('Josh Preview'), 'JP');
  assert.strictEqual(leadActivityInitials('Josh'), 'J');
  assert.strictEqual(leadActivityInitials('josh   preview'), 'JP');
  assert.strictEqual(leadActivityInitials('Josh Van Der Berg'), 'JV');
});

test('leadActivityInitials always renders something', () => {
  assert.strictEqual(leadActivityInitials(''), '?');
  assert.strictEqual(leadActivityInitials(undefined), '?');
  assert.strictEqual(leadActivityInitials('   '), '?');
});
