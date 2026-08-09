# Pruned remote branches — 2026-08-08

Record of remote branches deleted from `berneyiscool-debug/RELAY-Dispatch` during a
branch cleanup, so any of them can be restored if a deletion turns out to be wrong.

To restore one:

```bash
git push origin <sha>:refs/heads/<branch-name>
```

The commits stay reachable by SHA on GitHub for roughly 90 days after the branch ref
is deleted, so restore from this list rather than from memory.

## Kept (real unmerged work — do NOT delete)

| Branch | SHA | Why kept |
|---|---|---|
| `claude/simple-mode-layout-m36zxo` | `37bff12` | **Simple Mode** — a touch-friendly field-technician interface (`src/pages/field/FieldMode.js`, 547 lines, plus `src/styles/field.css`, 574 lines). Neither file exists on `main`. Unmerged feature work. |
| `claude/dazzling-johnson-ovegnb` | `c212483` | README rewrite (`# RELAY — Dispatch` overview). `main`'s README is still the scaffold `# rd-app-client`, so this branch is an improvement over what's shipped. |

## Deleted — fully merged into main (0 unique commits)

Every commit on these was already contained in `main`, so deleting the ref removed
nothing. All are April 2026 PR branches, mostly from `google-labs-jules[bot]`.

| SHA | Branch |
|---|---|
| `4cf01b3` | feature-phase-4-implementation-5693874702320933521 |
| `925ed6e` | feature/schedule-layout-16121264906141810553 |
| `e55d68e` | fix-datastore-settings-tests-15188248828907907314 |
| `1ee8ab6` | fix-format-date-test-coverage-14883327600556781970 |
| `5559399` | fix-job-detail-xss-13595364933762241704 |
| `fec8ff7` | fix-modal-dom-xss-9160901671096566782 |
| `f37c0b3` | fix-print-preview-xss-3128957489606604070 |
| `398accd` | fix-schedule-drag-and-drop-893763847762274255 |
| `66c0afd` | fix-unused-closemodal-export-15212647282469708384 |
| `00ccdee` | improve-router-testing-11836519148470913613 |
| `38adf34` | optimize-job-detail-html-gen-13043912824680150833 |
| `38545a4` | optimize-po-receive-stock-update-6672913139111762034 |
| `9f18143` | perf-optimize-report-timesheets-3166833009488022404 |
| `35ad221` | performance-optimize-notifications-mark-all-read-15710085868972220187 |
| `e0b294b` | refactor-detail-header-993064931412452251 |
| `e970b9a` | refactor-reports-render-11634687345888167826 |
| `bf6cede` | remove-seed-console-log-14129189634710770213 |
| `f402874` | schedule-view-tech-focus-13652506724834444674 |
| `1950f05` | security-fix-xss-datatable-10197824725142333893 |
| `a00cef0` | test-datastore-7188604256534636264 |

## Deleted — superseded (unique commits, but the content is already on main)

| SHA | Branch | Why safe |
|---|---|---|
| `5e4c2f2` | `claude/domain-website-hosting-xwnrff` | Squash-merged as `54c54db` ("Fit app to the visible viewport on iPad/iOS", PR #27). `git diff origin/main <branch> -- src/styles/layout.css src/styles/components.css` is **empty** — the files are byte-identical, so only the ref differed. |
| `9f97e22` | `claude/gracious-chebyshev-bab388` | The original infinite-canvas dashboard / Relay assistant spike from June. Long superseded: `RelayAssistant.js` is 188 lines here vs **1969** on main, `Dashboard.js` 2383 vs **3594**. Main is a strict superset in capability. |

## Not on the remote at all — local worktree branches

These live only in the local repo and were untouched by this cleanup. Note the SMS
work exists **nowhere but this machine**:

- `claude/service-cost-per-user-c44ca1` (`e46b322`) — the v1.3 #6 SMS build (3 edge
  functions, 5 client modules, 2 migrations). Its migrations are numbered 008/009 and
  collide with `008_schedule.sql` / `009_system_locks.sql` on main; they need
  renumbering to 012/013 before it can merge.
- `claude/app-monetization-data-2ebdf8` (`9b5390e`) — data-platform Phase 1.
