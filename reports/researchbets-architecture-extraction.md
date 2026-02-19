# ResearchBets Reusable Architecture & Product Extraction

## 1) PRODUCT VISION LAYER

```json
{
  "thesis": "Build modular AI agents that can be orchestrated through a shared execution API and surfaced in lightweight dashboards for operational automation, insight generation, and iterative governance.",
  "target_user": "Operators, strategists, and technical teams needing fast deployment of domain-specific agents with observability and governance controls.",
  "differentiation": "Dependency-aware agent orchestration (`dependsOn` in metadata + recursive execution), dynamic agent loading with metadata schema validation, and explainability-oriented output surfaces (logs, audit summaries, flow steps with explanations).",
  "transferable_product_principles": [
    "Treat each research capability as an independent agent module with explicit metadata contracts.",
    "Use orchestrated multi-step flows (with fallback/warn behavior) for complex analyses rather than single-model calls.",
    "Persist both execution logs and audit summaries so users can inspect what happened and why.",
    "Expose real-time run status in UI (waiting/running/complete/error) to increase trust during long-running analyses.",
    "Support localization/translation at output layer so core intelligence remains model/domain-agnostic."
  ]
}
```

## 2) FRONTEND ARCHITECTURE PATTERNS

```json
{
  "layout_patterns": [
    "Route-level split between operational dashboard (`/`) and marketing/onboarding surfaces (`/landing`, `/welcome`).",
    "Dashboard uses stacked sections and two-column grid cards (logs + metrics), while some advanced components use panel/drawer overlays for detail inspection.",
    "Flow visualizations use horizontal node lanes with SVG edges and modal/drawer drill-down."
  ],
  "reusable_components": [
    "`AgentLogList` + `AgentLogItem` pattern for filterable event streams.",
    "`AgentDetailDrawer` for expandable execution detail (input/output/explanation, copy/download JSON).",
    "`FlowStatusBadge` + status color mapping for lifecycle state indication.",
    "`NeuralAgentFlow` for node/edge workflow rendering with live Firestore updates.",
    "Theme context with persisted dark/light mode toggle.",
    "Metrics chart wrapper around Recharts with dynamic agent line generation."
  ],
  "trust_patterns": [
    "Success/error iconography (`✅`/`❌`) directly on log items.",
    "Timestamped entries and per-agent filtering + errors-only view.",
    "Drawer-level raw input/output/explanation visibility and JSON export.",
    "Live status progression and output snippet on completed nodes."
  ],
  "interaction_patterns": [
    "Polling-based live refresh for log and metric panels (3s/5s/10s intervals depending on component).",
    "Firestore `onSnapshot` subscriptions for near-real-time logs and flow node/edge updates.",
    "Framer Motion for micro-interactions (hover scale, overlay transitions, animated log toasts).",
    "Canvas-based animated neural background with reduced-motion detection and pointer parallax offset."
  ],
  "weaknesses": [
    "No unified AppShell with persistent left nav/top controls across dashboard variants.",
    "State management is local-component and duplicated across pages; no central store/query cache.",
    "Loading/error states are inconsistent; many fetch paths assume happy-path or silently fallback.",
    "Tailwind theme lacks custom token system (`extend` empty), reducing design consistency at scale.",
    "Mixed data contracts in log ingestion (CSV parsing in some places, JSON parsing in others for same file path)."
  ]
}
```

## 3) AGENT / BACKEND TRANSPARENCY PATTERNS

```json
{
  "telemetry_model": "Dual logging layers: generic execution logs (`logs` collection) plus audit summaries (`auditLogs`) with compact input/result truncation. Flow orchestration persists step state to `flows/{userId}/{runId}` and appends per-step status events.",
  "agent_surface_pattern": "Single API entrypoint (`/run-agent` and alias `/executeAgent`) invokes dependency-resolved agents via metadata, returns both final result and dependency result graph (`allResults`).",
  "explainability_pattern": "Agent responses can include `explanation`; flow engine propagates explanation at step level; UI drawers expose input/output/explanation triad for each selected run node/log.",
  "confidence_model": "Confidence is contract-level but not platform-normalized: architecture/docs expect agents may return `confidence`, yet there is no cross-agent calibration, scoring rubric, or UI confidence standardization.",
  "observability_strengths": [
    "Dependency resolution and metadata validation reduce opaque runtime failures.",
    "Flow step persistence (started/completed/error + fallback context) creates replayable execution histories.",
    "Audit summarization separates high-volume logs from concise governance-level traces.",
    "Usage and billing hooks create per-user run accounting linked to sessions."
  ]
}
```

## 4) UX GAPS / DESIGN DEBT

```json
{
  "architectural_mismatch": [
    "Backend supports orchestrated, dependency-rich, metadata-driven execution while primary dashboard still centers on raw log text panes.",
    "Run/session constructs exist backend-side (`sessionId`, `runId`) but are not first-class navigable entities in the main UI information architecture.",
    "Audit and usage signals are collected but not surfaced as a cohesive operator console."
  ],
  "UX_gaps": [
    "Limited explicit loading/error skeletons for network-driven panels.",
    "No queryable timeline tying input -> dependent agent chain -> output artifacts in a single canonical run page.",
    "No confidence distribution visuals, anomaly alerts, or quality trend panels despite telemetry availability.",
    "Terminal-grade workflows missing: keyboard navigation, dense table views, saved filters, multi-panel compare mode."
  ],
  "quick_wins": [
    "Introduce a canonical `Run Detail` route keyed by run/session ID with tabs: graph, logs, artifacts, audit.",
    "Standardize log schema ingestion (JSONL or structured API) and remove mixed parser assumptions.",
    "Add shared async state components (`LoadingState`, `EmptyState`, `ErrorState`, retry actions).",
    "Define and enforce a normalized confidence contract (`score`, `method`, `calibration_version`) across agents and UI cards."
  ]
}
```

## 5) DIRECT CODE REUSE CANDIDATES

```json
{
  "high_value_files": [
    "functions/agent.js (dependency-aware execution API + metadata gating)",
    "core/agentFlowEngine.js (multi-step flow runner with placeholder resolution, fallback behavior, per-step persistence)",
    "functions/loadAgents.js (dynamic agent loader with metadata validation)",
    "functions/logging.js and functions/auditLogger.js (baseline telemetry + audit summarization pattern)",
    "src/components/NeuralAgentFlow.jsx (workflow graph UI with step status + detail drill-down)",
    "src/components/AgentLogList.jsx + src/components/AgentDetailDrawer.jsx (inspectable event stream pattern)",
    "src/hooks/useAgentStepStatus.js (real-time/fallback run status hook contract)"
  ],
  "refactor_candidates": [
    "Consolidate repeated `/logs/learning.log` polling logic in `Dashboard`, `AgentDashboard`, `AgentMetricsChart`, and `AgentStatusStrip` into a shared data client.",
    "Split orchestration concerns in `functions/agent.js` into explicit services (resolver, executor, translator, usage recorder) for testability.",
    "Unify legacy and modern dashboard surfaces to remove duplicated metrics/log rendering implementations.",
    "Promote flow step schema definitions into typed contracts shared by backend and frontend."
  ],
  "shared_primitives": [
    "Status badge primitive (waiting/running/complete/error) with semantic color + icon mapping.",
    "Log row + detail drawer primitives reusable for trade/event/market signal inspection.",
    "Graph panel primitive for dependency trees (agents now, models/signals later).",
    "Theme + density primitives to support terminal-like compact and standard display modes."
  ]
}
```

## 6) STRATEGIC INSIGHTS

```json
{
  "terminal_upgrades": [
    "Adopt a persistent multi-pane AppShell (watchlist/left nav, central analysis canvas, right-side trace/details) with resizable panels.",
    "Implement keyboard-first command palette and shortcuts for run navigation, filtering, and replay.",
    "Add saved layouts, workspace presets, and user-level panel state persistence.",
    "Replace ad-hoc polling with streaming/event bus architecture for low-latency terminal feel."
  ],
  "data_surface_upgrades": [
    "Add market/time-series-native primitives (candles, spreads, order-book-like depth panels, event timelines) layered with agent outputs.",
    "Introduce cross-run comparison tables and factor attribution views for research validation.",
    "Expose lineage graph from raw source -> transformation -> model inference -> recommendation.",
    "Build scenario and backtest modules tied to the same agent flow contracts for reproducible research."
  ],
  "authority_signals_missing": [
    "No explicit data provenance badges (source, freshness, ingest timestamp, transform version).",
    "No model/version cards showing prompt, policy, and evaluation snapshot used per output.",
    "No calibrated confidence intervals or error bars tied to historical accuracy.",
    "No operator-grade incident panel (degraded agents, delayed feeds, failed dependencies) surfaced prominently."
  ]
}
```
