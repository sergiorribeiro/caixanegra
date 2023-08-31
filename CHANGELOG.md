# Changelog
## **0.1.2** (2023-06-15)
- `unit_scope` now supports multiple scopes, when separated by a comma (,)
- Executions no longer need unit scopes
- Added `exit_and_return` to the Unit DSL. This will cause immediate carry over return, without flowing into the next unit
- On the designer, connecting a unit when the canvas is offsetted will no longer miscalculate the mouse position
- Corrected a bug where the unit pane wasn't dismissed after deleting the unit

## **0.2.0** (2023-06-27)
- **breaking change** units are no longer configured and scoped with a hash. See wiki
- Added `configure_scope` to the Unit DSL. This will set the unit scope
- Unit menu now groups units by their scope
- Fixed bug where next unit oid was not being correctly logged

## **0.3.0** (2023-08-31)
- New input data type added: `boolean`
- Unit color overrides with luminance calculation by adding `configure_color` to the Unit DSL
- Enhanced unit exception report
- **breaking change** removed Redis dependency in favor of an arbitrary transient store