import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { store } from '../../data/store.js';
import {
  canEditFile, copyName, withExtension, renameFile, deleteFiles, duplicateFile, COPY_FOLDER,
} from './documentEdits.js';

// Entries as the Document Center lists them: each file says where it is kept.
const uploadEntry = (id) => ({ id, name: 'Policy.pdf', source: { type: 'doc', id } });
const listEntry = (index) => ({ id: `job_j1_att_${index}`, name: 'x', source: { type: 'list', collection: 'jobs', recordId: 'j1', index } });
const logEntry = (logId, fileIndex) => ({ id: `${logId}_${fileIndex}`, name: 'x', source: { type: 'log', recordId: 'j1', logId, fileIndex } });

describe('document edits', () => {
  beforeEach(() => {
    store.clearSync();
    store.listeners = {};
    store.cache.documents = [{ id: 'd1', name: 'Policy.pdf', folder: 'Health & Safety', url: 'data:application/pdf;base64,AAAA', type: 'application/pdf', size: 3 }];
    store.cache.jobs = [{
      id: 'j1',
      attachments: [{ name: 'a.jpg' }, { name: 'b.jpg' }, { name: 'c.jpg' }],
      activityLog: [
        { id: 'L1', type: 'combined', content: '', files: [{ name: 'p1.jpg' }, { name: 'p2.jpg' }] },
        { id: 'L2', type: 'combined', content: 'Keep this note', files: [{ name: 'q.pdf' }] },
        { id: 'L3', type: 'attachment', file: { name: 'old.png' } },
        { id: 'L4', type: 'combined', content: 'Untouched', files: [] },
      ],
    }];
  });

  test('only entries with a stored file are editable', () => {
    assert.strictEqual(canEditFile(uploadEntry('d1')), true);
    assert.strictEqual(canEditFile({ id: 'inv1', render: { kind: 'invoice', id: 'inv1' } }), false);
  });

  test('copy names keep the extension', () => {
    assert.strictEqual(copyName('Report.pdf'), 'Report - Copy.pdf');
    assert.strictEqual(copyName('Notes'), 'Notes - Copy');
  });

  test('a rename without an extension keeps the old one', () => {
    assert.strictEqual(withExtension('Site photo', 'IMG_1.jpg'), 'Site photo.jpg');
    assert.strictEqual(withExtension('Site photo.png', 'IMG_1.jpg'), 'Site photo.png');
    assert.strictEqual(withExtension('  Plain  ', 'notes'), 'Plain');
  });

  test('renames an upload, a job attachment and an activity-log file', () => {
    renameFile(uploadEntry('d1'), 'Safety policy.pdf');
    renameFile(listEntry(1), 'B renamed.jpg');
    renameFile(logEntry('L1', 1), 'P2 renamed.jpg');
    renameFile(logEntry('L3', null), 'Old renamed.png');
    assert.strictEqual(store.getById('documents', 'd1').name, 'Safety policy.pdf');
    const job = store.getById('jobs', 'j1');
    assert.strictEqual(job.attachments[1].name, 'B renamed.jpg');
    assert.strictEqual(job.activityLog[0].files[1].name, 'P2 renamed.jpg');
    assert.strictEqual(job.activityLog[2].file.name, 'Old renamed.png');
  });

  test('rejects an empty name and records that are renamed elsewhere', () => {
    assert.throws(() => renameFile(uploadEntry('d1'), '   '), /Enter a name/);
    assert.throws(() => renameFile({ id: 'q1', render: { kind: 'quote', id: 'q1' } }, 'X'), /own page/);
  });

  test('deletes several attachments from one record without shifting the wrong ones', () => {
    const { deleted } = deleteFiles([listEntry(0), listEntry(2)]);
    assert.strictEqual(deleted, 2);
    assert.deepStrictEqual(store.getById('jobs', 'j1').attachments.map(a => a.name), ['b.jpg']);
  });

  test('deleting log files drops posts left empty but keeps notes', () => {
    deleteFiles([logEntry('L1', 0), logEntry('L1', 1), logEntry('L2', 0), logEntry('L3', null)]);
    const log = store.getById('jobs', 'j1').activityLog;
    assert.deepStrictEqual(log.map(l => l.id), ['L2', 'L4']);
    assert.deepStrictEqual(log[0].files, []);
    assert.strictEqual(log[0].content, 'Keep this note');
  });

  test('deletes uploads and skips records', () => {
    const { deleted, skipped } = deleteFiles([uploadEntry('d1'), { id: 'inv1', render: { kind: 'invoice', id: 'inv1' } }]);
    assert.strictEqual(deleted, 1);
    assert.strictEqual(skipped, 1);
    assert.ok(!store.getById('documents', 'd1'));
  });

  test('duplicates an upload into its own folder without reading it again', async () => {
    let read = 0;
    const copy = await duplicateFile({ ...uploadEntry('d1'), folder: 'Health & Safety' }, async () => { read++; });
    assert.strictEqual(read, 0);
    assert.strictEqual(copy.name, 'Policy - Copy.pdf');
    assert.strictEqual(copy.folder, 'Health & Safety');
    assert.strictEqual(copy.url, 'data:application/pdf;base64,AAAA');
    assert.strictEqual(store.getAll('documents').length, 2);
  });

  test('a copy of a linked file or record goes to Company Docs', async () => {
    globalThis.FileReader = class {
      readAsDataURL() { this.result = 'data:application/pdf;base64,QkI='; this.onload(); }
    };
    try {
      const copy = await duplicateFile(
        { id: 'inv1', name: 'Invoice INV-1.pdf', folder: 'Invoices', render: { kind: 'invoice', id: 'inv1' } },
        async () => ({ name: 'Invoice_INV-1.pdf', type: 'application/pdf', size: 2 }),
      );
      assert.strictEqual(copy.folder, COPY_FOLDER);
      assert.strictEqual(copy.name, 'Invoice_INV-1 - Copy.pdf');
      assert.strictEqual(copy.url, 'data:application/pdf;base64,QkI=');
    } finally {
      delete globalThis.FileReader;
    }
  });
});
