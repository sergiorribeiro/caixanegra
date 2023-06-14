# Changelog
## **0.1.2** (2023-06-15)
- `unit_scope` now supports multiple scopes, when separated by a comma (,)
- Executions no longer need unit scopes
- Added `exit_and_return` to the Unit DSL. This will cause immediate carry over return, without flowing into the next unit
- On the designer, connecting a unit when the canvas is offsetted will no longer miscalculate the mouse position
- Corrected a bug where the unit pane wasn't dismissed after deleting the unit

# WIP
- Add `boolean` input data type
- Add unit color override