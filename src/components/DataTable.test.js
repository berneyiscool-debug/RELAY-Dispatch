// `DataTable` renders into a live DOM, but the decision about *what* to show is
// made by `planTableRows`, which is pure. Everything here exercises that planner
// directly: the ungrouped path is pinned against the legacy sort/page algorithm
// because sixteen other pages depend on it staying byte-for-byte identical, and
// the grouped path is pinned on the rules a pipeline view relies on (groups in
// pipeline order, totals for the whole group even when the group is split across
// a page break, collapsed groups keeping their header but taking no page slots).
import test from 'node:test';
import assert from 'node:assert/strict';
import { planTableRows, resolveDropGroup, GROUP_ROW_CLASS } from './DataTable.js';

const columns = {
  title: { key: 'title', label: 'Title' },
  value: { key: 'value', label: 'Value' },
};

// Mirrors `compareRows` in DataTable.js — the reference implementation the
// ungrouped branch has to keep matching.
function legacySort(rows, sortCol, sortDir) {
  const sorted = [...rows];
  if (!sortCol) return sorted;
  sorted.sort((a, b) => {
    const aVal = sortCol.getValue ? sortCol.getValue(a) : a[sortCol.key];
    const bVal = sortCol.getValue ? sortCol.getValue(b) : b[sortCol.key];
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (typeof aVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });
  return sorted;
}

function legacyPlan(rows, { sortCol = null, sortDir = 'desc', pageSize = 15, currentPage = 1 } = {}) {
  const sorted = legacySort(rows, sortCol, sortDir);
  const totalPages = Math.ceil(sorted.length / pageSize);
  const page = currentPage > totalPages ? (totalPages || 1) : currentPage;
  const start = (page - 1) * pageSize;
  return {
    rows: sorted.slice(start, start + pageSize),
    totalPages,
    page,
    start,
    end: Math.min(start + pageSize, sorted.length),
  };
}

function lead(id, status, value, title = `Lead ${id}`) {
  return { id, title, status, value };
}

function statusGroups(order = ['New', 'Contacted', 'Won']) {
  return {
    getKey: (lead) => lead.status,
    order,
    labelFor: (key) => key,
    summarize: (rows) => ({ totalValue: rows.reduce((sum, r) => sum + r.value, 0) }),
  };
}

test('ungrouped output matches the legacy sort and page algorithm', () => {
  const data = [
    lead('a', 'New', 100, 'Zeta'),
    lead('b', 'Contacted', 400, 'Alpha'),
    lead('c', 'Won', 250, 'Mid'),
    lead('d', 'New', 50, 'Beta'),
  ];

  for (const sortDir of ['asc', 'desc']) {
    for (const pageSize of [1, 2, 3, 15]) {
      for (const currentPage of [1, 2, 3]) {
        const expected = legacyPlan(data, { sortCol: columns.title, sortDir, pageSize, currentPage });
        const actual = planTableRows({
          data, sortCol: columns.title, sortDir, pageSize, currentPage,
        });

        assert.equal(actual.grouped, false);
        assert.deepEqual(actual.rows.map(item => item.row), expected.rows);
        assert.deepEqual(actual.rows.map(item => item.id), expected.rows.map(r => String(r.id)));
        assert.equal(actual.totalPages, expected.totalPages);
        assert.equal(actual.currentPage, expected.page);
        assert.equal(actual.start, expected.start);
        assert.equal(actual.end, expected.end);
        assert.equal(actual.visibleTotal, data.length);
      }
    }
  }
});

test('ungrouped paging past the end clamps to the last page', () => {
  const data = [lead('a', 'New', 1), lead('b', 'New', 2), lead('c', 'New', 3)];
  const plan = planTableRows({ data, pageSize: 2, currentPage: 9 });

  assert.equal(plan.currentPage, 2);
  assert.equal(plan.start, 2);
  assert.equal(plan.end, 3);
  assert.deepEqual(plan.rows.map(item => item.row.id), ['c']);
});

test('ungrouped empty input reports page 1 with zero totals', () => {
  const plan = planTableRows({ data: [], pageSize: 15, currentPage: 4 });

  assert.equal(plan.grouped, false);
  assert.equal(plan.totalPages, 0);
  assert.equal(plan.currentPage, 1);
  assert.equal(plan.end, 0);
  assert.deepEqual(plan.rows, []);
});

test('groups are emitted in the caller-declared pipeline order', () => {
  const data = [lead('w', 'Won', 10), lead('n', 'New', 20), lead('c', 'Contacted', 30)];
  const plan = planTableRows({ data, groupBy: statusGroups(['New', 'Contacted', 'Won']) });

  assert.equal(plan.grouped, true);
  assert.deepEqual(plan.groups.map(g => g.key), ['New', 'Contacted', 'Won']);
  assert.deepEqual(plan.rows.filter(r => r.type === 'group').map(r => r.key), ['New', 'Contacted', 'Won']);
});

test('a zero-count declared group keeps its header but contributes no rows', () => {
  const data = [lead('n', 'New', 20)];
  const plan = planTableRows({ data, groupBy: statusGroups(['New', 'Contacted', 'Won']) });

  const empty = plan.groups.find(g => g.key === 'Won');
  assert.equal(empty.count, 0);
  assert.equal(empty.totalValue, 0);
  assert.deepEqual(plan.rows.filter(r => r.type === 'group').map(r => r.key), ['New', 'Contacted', 'Won']);
  assert.equal(plan.rows.filter(r => r.type === 'row').length, 1);
  assert.equal(plan.visibleTotal, 1);
});

test('undeclared group keys follow the declared ones in first-appearance order', () => {
  const data = [lead('x', 'Archived', 5), lead('n', 'New', 20), lead('y', 'Archived', 5)];
  const plan = planTableRows({ data, groupBy: statusGroups(['New']) });

  assert.deepEqual(plan.groups.map(g => g.key), ['New', 'Archived']);
  assert.equal(plan.groups[1].count, 2);
});

test('an empty declared stage between populated ones is emitted in pipeline position', () => {
  const data = [lead('n1', 'New', 20), lead('w1', 'Won', 30)];
  const plan = planTableRows({
    data, groupBy: statusGroups(['New', 'Contacted', 'Won']),
  });

  // The header must exist: it is the drop target for dragging a lead into a
  // stage that has nothing in it yet.
  assert.deepEqual(plan.rows.map(r => r.key ?? r.id), ['New', 'n1', 'Contacted', 'Won', 'w1']);
  const empty = plan.rows.find(r => r.type === 'group' && r.key === 'Contacted');
  assert.equal(empty.count, 0);
  assert.equal(empty.visibleCount, 0);
  assert.equal(empty.visibleFrom, 0);
  assert.equal(empty.continuation, false);
  assert.equal(empty.truncated, false);
  assert.equal(plan.visibleTotal, 2);
});

test('rows sort within a group, never across group boundaries', () => {
  const data = [
    lead('n1', 'New', 100, 'Bravo'),
    lead('w1', 'Won', 100, 'Alpha'),
    lead('n2', 'New', 100, 'Alpha'),
  ];
  const plan = planTableRows({
    data, groupBy: statusGroups(['New', 'Won']), sortCol: columns.title, sortDir: 'asc',
  });

  // Group order wins over the column sort, and each group is sorted internally.
  assert.deepEqual(plan.rows.map(r => r.key ?? r.row.title), ['New', 'Alpha', 'Bravo', 'Won', 'Alpha']);
  assert.deepEqual(plan.groups.map(g => g.count), [2, 1]);
});

test('group totals describe the whole group, not the visible page', () => {
  const data = [
    lead('n1', 'New', 100), lead('n2', 'New', 200), lead('n3', 'New', 300),
    lead('w1', 'Won', 400),
  ];
  const plan = planTableRows({
    data, groupBy: statusGroups(['New', 'Won']), pageSize: 2, currentPage: 1,
  });

  const newGroup = plan.groups.find(g => g.key === 'New');
  assert.equal(newGroup.count, 3);
  assert.equal(newGroup.totalValue, 600);

  const header = plan.rows.find(r => r.type === 'group' && r.key === 'New');
  assert.equal(header.count, 3);
  assert.equal(header.totalValue, 600);
  assert.equal(header.visibleCount, 2);
  assert.equal(header.visibleFrom, 1);
  assert.equal(header.continuation, false);
});

test('a group split across a page break flags continuation and truncation', () => {
  const data = [
    lead('n1', 'New', 1), lead('n2', 'New', 1), lead('n3', 'New', 1),
    lead('n4', 'New', 1), lead('n5', 'New', 1),
  ];
  const plan = planTableRows({
    data, groupBy: statusGroups(['New']), pageSize: 2, currentPage: 2,
  });

  const header = plan.rows.find(r => r.type === 'group');
  assert.equal(header.continuation, true);
  assert.equal(header.truncated, true);
  assert.equal(header.count, 5);
  assert.equal(header.visibleFrom, 3);
  assert.equal(header.visibleCount, 2);
  assert.deepEqual(plan.rows.filter(r => r.type === 'row').map(r => r.id), ['n3', 'n4']);
});

test('a group that ends on the page is a continuation but not truncated', () => {
  const data = [
    lead('n1', 'New', 1), lead('n2', 'New', 1), lead('n3', 'New', 1), lead('n4', 'New', 1),
  ];
  const plan = planTableRows({
    data, groupBy: statusGroups(['New']), pageSize: 2, currentPage: 2,
  });

  const header = plan.rows.find(r => r.type === 'group');
  assert.equal(header.continuation, true);
  assert.equal(header.truncated, false);
  assert.equal(header.visibleFrom, 3);
  assert.equal(header.visibleCount, 2);
  assert.deepEqual(plan.rows.filter(r => r.type === 'row').map(r => r.id), ['n3', 'n4']);
});

test('a finished group does not claim truncation on the last page', () => {
  const data = [lead('n1', 'New', 1), lead('n2', 'New', 1), lead('n3', 'New', 1)];
  const plan = planTableRows({
    data, groupBy: statusGroups(['New']), pageSize: 3, currentPage: 1,
  });

  const header = plan.rows.find(r => r.type === 'group');
  assert.equal(header.continuation, false);
  assert.equal(header.truncated, false);
  assert.equal(header.visibleCount, 3);
});

test('collapsed groups keep their header but take no page slots', () => {
  const data = [lead('n1', 'New', 10), lead('c1', 'Contacted', 20), lead('w1', 'Won', 30)];
  const plan = planTableRows({
    data,
    groupBy: statusGroups(['New', 'Contacted', 'Won']),
    collapsed: new Set(['Contacted']),
  });

  assert.equal(plan.visibleTotal, 2);
  assert.deepEqual(plan.rows.filter(r => r.type === 'row').map(r => r.id), ['n1', 'w1']);

  const header = plan.rows.find(r => r.type === 'group' && r.key === 'Contacted');
  assert.equal(header.collapsed, true);
  assert.equal(header.count, 1);
  assert.equal(header.visibleCount, 0);
  assert.equal(header.totalValue, 20);
  assert.deepEqual(plan.rows.map(r => r.key ?? r.id), ['New', 'n1', 'Contacted', 'Won', 'w1']);
});

test('collapsing every group leaves an empty page at page 1', () => {
  const data = [lead('n1', 'New', 10)];
  const plan = planTableRows({
    data, groupBy: statusGroups(['New']), collapsed: new Set(['New']),
  });

  assert.equal(plan.totalPages, 0);
  assert.equal(plan.currentPage, 1);
  assert.equal(plan.visibleTotal, 0);
  assert.equal(plan.end, 0);
  assert.deepEqual(plan.rows.filter(r => r.type === 'row'), []);
  assert.equal(plan.rows.filter(r => r.type === 'group').length, 1);
});

test('headers carry a clean summary and no row payload', () => {
  const data = [lead('n1', 'New', 10)];
  const plan = planTableRows({ data, groupBy: statusGroups(['New']) });

  const header = plan.rows.find(r => r.type === 'group');
  assert.equal(header.type, 'group');
  assert.equal(header.row, undefined);
  assert.equal(header.summary.key, 'New');
  assert.equal(header.summary.label, 'New');
  assert.equal(header.summary.count, 1);
  assert.equal(header.summary.totalValue, 10);
  assert.equal(header.key, 'New');
});

test('missing group keys fall into an empty-string group instead of throwing', () => {
  const data = [lead('n1', 'New', 10), { id: 'z1', title: 'Orphan', value: 1 }, { id: 'z2', title: 'Orphan 2', value: 2 }];
  const plan = planTableRows({ data, groupBy: statusGroups(['New']) });

  assert.deepEqual(plan.groups.map(g => g.key), ['New', '']);
  assert.equal(plan.groups[1].count, 2);
  assert.equal(plan.visibleTotal, 3);
});

test('getId overrides the default id lookup for grouped and ungrouped rows', () => {
  const data = [{ uuid: 'u1', status: 'New', value: 1 }, { uuid: 'u2', status: 'New', value: 2 }];
  const getId = (row) => row.uuid;

  const ungrouped = planTableRows({ data, getId });
  assert.deepEqual(ungrouped.rows.map(r => r.id), ['u1', 'u2']);

  const grouped = planTableRows({ data, groupBy: statusGroups(['New']), getId });
  assert.deepEqual(grouped.rows.filter(r => r.type === 'row').map(r => r.id), ['u1', 'u2']);
});

test('the exported group row class is the one the renderer emits', () => {
  assert.equal(GROUP_ROW_CLASS, 'dt-group-row');
  assert.match(GROUP_ROW_CLASS, /^[a-z][a-z0-9-]*$/);
});

test('planning does not mutate the caller\'s array or rows', () => {
  const data = [lead('b', 'New', 2, 'Bravo'), lead('a', 'New', 1, 'Alpha')];
  const snapshot = JSON.parse(JSON.stringify(data));

  planTableRows({ data, sortCol: columns.title, sortDir: 'asc', groupBy: statusGroups(['New']) });

  assert.deepEqual(data, snapshot);
});

// `resolveDropGroup` answers "which group owns this slot?" from the planner's own
// rows, so these fixtures are the same output the renderer puts in the tbody:
// headers and rows interleaved, drop slots numbered in tbody order.

function dropPlan({ data, order, collapsed = [] } = {}) {
  return planTableRows({ data, groupBy: statusGroups(order), collapsed: new Set(collapsed) });
}

// What the browser leaves behind after a drop: the node removed and re-inserted,
// where `to` is the slot it ends up in — the same index the resolver is handed.
function dragRow(plan, from, to) {
  const rows = plan.rows.map(item => ({ ...item }));
  const [dragged] = rows.splice(from, 1);
  rows.splice(to, 0, dragged);
  assert.equal(rows[to], dragged);
  return { rows, dragged, index: to };
}

function rowIndex(plan, id) {
  return plan.rows.findIndex(item => item.type === 'row' && item.id === id);
}

function headerIndex(plan, key) {
  return plan.rows.findIndex(item => item.type === 'group' && item.key === key);
}

function shape(rows) {
  return rows.map(item => (item.type === 'group' ? `G:${item.key}` : `R:${item.id}`));
}

// Two rows per stage, so any stage can be dragged from or into.
function pipelineData() {
  return [
    lead('n1', 'New', 10),
    lead('n2', 'New', 20),
    lead('c1', 'Contacted', 30),
    lead('w1', 'Won', 40),
    lead('w2', 'Won', 50),
  ];
}

test('the drop fixtures interleave headers with their rows', () => {
  const plan = dropPlan({ data: pipelineData() });

  assert.deepEqual(shape(plan.rows), [
    'G:New', 'R:n1', 'R:n2',
    'G:Contacted', 'R:c1',
    'G:Won', 'R:w1', 'R:w2',
  ]);
});

test('a row dropped onto a populated header joins that header\'s group', () => {
  const plan = dropPlan({ data: pipelineData() });
  const header = headerIndex(plan, 'Contacted');
  assert.equal(header, 3);
  assert.equal(plan.rows[header].count, 1);

  // Released over the header, which the browser reports as the slot below it.
  const under = dragRow(plan, rowIndex(plan, 'w1'), header + 1);
  assert.equal(resolveDropGroup(under.rows, under.index), 'Contacted');

  // Released on the header's upper half, landing on the slot above it.
  const over = dragRow(plan, rowIndex(plan, 'w1'), header);
  assert.equal(resolveDropGroup(over.rows, over.index), 'Contacted');

  // A caller that can see the pointer names the header outright.
  assert.equal(resolveDropGroup(plan.rows, header, header), 'Contacted');
});

test('a row dropped onto an empty stage header joins that stage', () => {
  const plan = dropPlan({
    data: [lead('n1', 'New', 10), lead('w1', 'Won', 40)],
    order: ['New', 'Qualified', 'Won'],
  });
  assert.deepEqual(shape(plan.rows), ['G:New', 'R:n1', 'G:Qualified', 'G:Won', 'R:w1']);

  const empty = headerIndex(plan, 'Qualified');
  assert.equal(plan.rows[empty].count, 0);

  const under = dragRow(plan, rowIndex(plan, 'w1'), empty + 1);
  assert.equal(resolveDropGroup(under.rows, under.index), 'Qualified');

  const over = dragRow(plan, rowIndex(plan, 'w1'), empty);
  assert.equal(resolveDropGroup(over.rows, over.index), 'Qualified');
});

test('a row dropped onto a collapsed header joins that group', () => {
  const plan = dropPlan({ data: pipelineData(), collapsed: ['Contacted'] });
  assert.deepEqual(shape(plan.rows), ['G:New', 'R:n1', 'R:n2', 'G:Contacted', 'G:Won', 'R:w1', 'R:w2']);

  const collapsed = headerIndex(plan, 'Contacted');
  assert.equal(plan.rows[collapsed].collapsed, true);

  const under = dragRow(plan, rowIndex(plan, 'w2'), collapsed + 1);
  assert.equal(resolveDropGroup(under.rows, under.index), 'Contacted');

  const over = dragRow(plan, rowIndex(plan, 'w2'), collapsed);
  assert.equal(resolveDropGroup(over.rows, over.index), 'Contacted');
});

test('a row dropped between two rows inside a group stays in that group', () => {
  const plan = dropPlan({
    data: [
      lead('n1', 'New', 10),
      lead('n2', 'New', 20),
      lead('n3', 'New', 30),
      lead('c1', 'Contacted', 40),
    ],
  });
  assert.deepEqual(shape(plan.rows), ['G:New', 'R:n1', 'R:n2', 'R:n3', 'G:Contacted', 'R:c1', 'G:Won']);

  const up = dragRow(plan, rowIndex(plan, 'n3'), rowIndex(plan, 'n2'));
  assert.equal(resolveDropGroup(up.rows, up.index), 'New');

  const down = dragRow(plan, rowIndex(plan, 'n1'), rowIndex(plan, 'n2'));
  assert.equal(resolveDropGroup(down.rows, down.index), 'New');
});

test('a row dropped directly above the first header joins the first group', () => {
  const plan = dropPlan({ data: pipelineData() });
  assert.equal(plan.rows[0].type, 'group');

  const top = dragRow(plan, rowIndex(plan, 'w2'), 0);
  assert.deepEqual(shape(top.rows), [
    'R:w2',
    'G:New', 'R:n1', 'R:n2',
    'G:Contacted', 'R:c1',
    'G:Won', 'R:w1',
  ]);
  assert.equal(resolveDropGroup(top.rows, top.index), 'New');
});

test('a row dropped below the last row of the last group joins that group', () => {
  const plan = dropPlan({ data: pipelineData() });
  const bottom = plan.rows.length - 1;

  const moved = dragRow(plan, rowIndex(plan, 'n1'), bottom);
  assert.deepEqual(shape(moved.rows), [
    'G:New', 'R:n2',
    'G:Contacted', 'R:c1',
    'G:Won', 'R:w1', 'R:w2', 'R:n1',
  ]);
  assert.equal(resolveDropGroup(moved.rows, moved.index), 'Won');
});

test('a row dropped immediately after a header, before its first row, joins that group', () => {
  const plan = dropPlan({ data: pipelineData() });
  const header = headerIndex(plan, 'Contacted');
  assert.equal(header, 3);

  // Slot 3 is the gap between the Contacted header and its first row.
  const moved = dragRow(plan, rowIndex(plan, 'n1'), header);
  assert.deepEqual(shape(moved.rows), [
    'G:New', 'R:n2',
    'G:Contacted', 'R:n1', 'R:c1',
    'G:Won', 'R:w1', 'R:w2',
  ]);
  assert.equal(resolveDropGroup(moved.rows, moved.index), 'Contacted');
});

test('an explicit drop target header outranks the surrounding geometry', () => {
  const plan = dropPlan({ data: pipelineData() });
  const won = headerIndex(plan, 'Won');

  // Without the pointer the slot above the header reads as the group before it...
  assert.equal(resolveDropGroup(plan.rows, won), 'Contacted');
  // ...and naming the header settles it.
  assert.equal(resolveDropGroup(plan.rows, won, won), 'Won');
});

test('drop resolution reports null rather than guessing', () => {
  const ungrouped = planTableRows({ data: [lead('u1', 'New', 1), lead('u2', 'Won', 2)] });
  assert.equal(ungrouped.grouped, false);
  assert.equal(resolveDropGroup(ungrouped.rows, 0), null);
  assert.equal(resolveDropGroup(ungrouped.rows, 1), null);

  const plan = dropPlan({ data: pipelineData() });
  assert.equal(resolveDropGroup(plan.rows, -1), null);
  assert.equal(resolveDropGroup(plan.rows, plan.rows.length), null);
  assert.equal(resolveDropGroup(plan.rows, 1.5), null);
  assert.equal(resolveDropGroup(plan.rows, 99), null);
  // An out-of-range drop target is ignored, leaving the geometry to decide.
  assert.equal(resolveDropGroup(plan.rows, 4, 5), 'Won');
  assert.equal(resolveDropGroup(plan.rows, 4, 400), 'Contacted');
  assert.equal(resolveDropGroup([], 0), null);
  assert.equal(resolveDropGroup(null, 0), null);
});

test('drop resolution does not mutate the rows it reads', () => {
  const plan = dropPlan({ data: pipelineData() });
  const snapshot = JSON.parse(JSON.stringify(plan.rows));

  resolveDropGroup(plan.rows, 0);
  resolveDropGroup(plan.rows, 3);
  resolveDropGroup(plan.rows, 3, 5);
  resolveDropGroup(plan.rows, plan.rows.length);

  assert.deepEqual(JSON.parse(JSON.stringify(plan.rows)), snapshot);
});

// The caller has to hand over the row order the browser left behind. A moved row
// shifts the index of every header it crosses, so resolving a post-drop slot against
// the list that was rendered reads a header a group too far down — here the topmost
// slot, which the stale list reports as `Contacted` rather than `New`.
test('a drop resolves against the post-drop row order, not the rendered one', () => {
  const plan = dropPlan({ data: pipelineData() });
  const { rows, index } = dragRow(plan, rowIndex(plan, 'n1'), 0);

  assert.deepEqual(shape(rows), [
    'R:n1',
    'G:New', 'R:n2',
    'G:Contacted', 'R:c1',
    'G:Won', 'R:w1', 'R:w2',
  ]);
  assert.equal(resolveDropGroup(rows, index), 'New');
  assert.equal(resolveDropGroup(plan.rows, index), 'Contacted');
});
