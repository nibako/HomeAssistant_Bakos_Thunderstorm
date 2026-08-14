# Changelog

## 1.3.1

- First repository-ready public release.
- Replaced private extracted audio with original procedural CC0 replacement audio.
- Removed user-specific cozy-light defaults.
- Updated Home Assistant repository metadata and public documentation.
- Retains persistent settings and gentle session ending introduced in 1.3.0.

## 1.3.0

- Persist runtime session settings in `/data/runtime-settings.json` and restore
  them after restart.
- Added selectable gentle session ending (0 / 5 / 8 / 12 seconds).
- Stop now prevents new storm events before fading and restoring room states.
