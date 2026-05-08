# Triage Labels

The skills speak in terms of canonical roles. This file maps those roles to the actual label strings used in this repo's issue tracker, and records any other labels the repo uses so agent briefs surface full context.

## State labels (mutually exclusive; one per triaged issue)

| Canonical label   | Label in our tracker | Meaning                                       |
| ----------------- | -------------------- | --------------------------------------------- |
| `needs-info`      | `needs-info`         | Waiting on reporter for more information      |
| `ready-for-agent` | `ready-for-agent`    | Fully specified, ready for an AFK agent       |
| `ready-for-human` | `ready-for-human`    | Requires human implementation                 |
| `wontfix`         | `wontfix`            | Will not be actioned                          |

An issue with **no state label** is in the inbox — it hasn't been triaged yet.

## Provenance label (optional)

| Canonical label | Label in our tracker | Meaning                                              |
| --------------- | -------------------- | ---------------------------------------------------- |
| `new`           | `new`                | Created via `to-issues` or `to-prd` (agent-flow)     |

Issues opened directly by humans (GitHub UI, API, etc.) carry no provenance label. That's fine — absence of `new` means human-opened.

## Category labels (mutually exclusive)

| Canonical label | Label in our tracker | Meaning                                |
| --------------- | -------------------- | -------------------------------------- |
| `bug`           | `bug`                | Something is broken                    |
| `enhancement`   | `enhancement`        | New feature or improvement             |

## Other labels in this repo

These labels exist in the tracker but aren't part of the canonical state/provenance/category model. The `triage` skill preserves them and surfaces them in agent briefs so implementing agents see the full context.

| Label             | Description (from tracker)                              |
| ----------------- | ------------------------------------------------------- |
| `documentation`   | Improvements or additions to documentation              |
| `duplicate`       | This issue or pull request already exists               |
| `help wanted`     | Extra attention is needed                               |
| `question`        | Further information is requested                        |
| `claude-redesign` | Redesign — using claude design                          |

## Usage

When a skill mentions a canonical role (e.g. "apply the AFK-ready triage label"), use the corresponding string from the right-hand column. Edit the right-hand columns to match whatever vocabulary you actually use; leave the left-hand columns alone — they're the canonical names the skills reference internally.
