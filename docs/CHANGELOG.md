# Changelog

## 2025-06-22
- Added `vision-guard-agent.js` for monitoring roadmap drift and SOP coverage.

## 2025-06-21
- Migrated agent logs to Firestore collections
- Added Firebase Hosting configuration and deployment workflow
- Cloud Functions now expose agents as callable endpoints

## 2025-06-20
- Added `guardian-agent.js` to governance role definitions and responsibilities.
- Documented "incubation" lifecycle stage.
- Updated feedback loops and CI/CD governance notes.
- Bumped constitution date to reflect changes.
- Implemented tone monitoring in guardian-agent.
- Added CI workflow to run guardian-agent on PRs modifying agents.

## 2025-06-21
- Implemented `guardian-agent.js` alignment scoring and metadata flagging.
- Board agent now demotes misaligned agents and opens `alignment-violation` issues.
- Constitution check warns on misaligned production agents.
- Added daily governance workflow running guardian and board agents.
- Updated constitution with new alignment governance.

