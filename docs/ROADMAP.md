# ROADMAP

90-day integrated build curriculum for arch-angel.
Research + Build + Learn run in parallel. This document is the stable anchor — it changes rarely.

---

## Identity

**Product:** Persistent architectural memory for engineering teams.
**Builder identity:** Production-grade AI Product Engineer with systems depth.
**Approach:** Product-first, learn by building. No tutorials. Ship, then understand.

---

## Build Levels

| Level | Days | What You Build | What You Learn |
|-------|------|----------------|----------------|
| **0** | 1-3 | Repo scanner: file tree, metadata, filtering, JSON output | File system traversal, recursion, CLI design, structured output |
| **1** | 4-10 | Architecture snapshot: entry points, dependencies, key modules → JSON + markdown | Static analysis, heuristics, pattern detection, summarization |
| **2** | 11-18 | Evidence-backed Q&A: chunking, embeddings, vector search, answer with citations | RAG fundamentals, embeddings, vector DBs, hallucination control |
| **3** | 19-26 | Decision memory (ADR): create entries, link to modules, retrieve during Q&A | Data modeling, persistence, memory systems beyond RAG |
| **4** | 27-35 | Drift detection: snapshot comparison, change flagging, ADR staleness alerts | Versioning, diffing, change detection, consistency rules |
| **5** | 36-45 | Evaluation harness: hallucination rate, citation accuracy, response consistency | Eval frameworks, reliability metrics, failure analysis |
| **Future** | Post-V1 | Agent loop: plan steps, run tools, propose reports, ask clarifying questions | Tool-use orchestration, state machines, reliability constraints |

---

## Phase 1 — Discovery + Foundations (Weeks 1-3)

**Objective:** Validate the pain while building base infrastructure.
Research and building run in parallel. Neither alone is sufficient.

### Week 1: Repo Intelligence Foundations

**Product track:**
- Level 0: Repo scanner — recursive directory traversal, file tree output
- Add file type detection, filtering logic (.gitignore respect)
- Generate structured JSON output + clean console output
- Set up CLI with Commander (scan command)

**Learning track:**
- File system APIs (fs, path)
- Recursion and tree structures
- Clean CLI design
- Modular architecture and separation of concerns

**Research track:**
- Map top 8 competitors (Copilot, Cursor, Sourcegraph Cody, Continue.dev, Replit AI, others)
- Extract feature positioning, pricing, target user
- Start pain mining: Hacker News, Reddit (r/programming, r/ExperiencedDevs), GitHub issues

**Deliverables:**
- [ ] Working repo scanner with JSON output
- [ ] Competitor matrix draft
- [ ] Pain cluster list v1

### Week 2: Architecture Snapshot

**Product track:**
- Level 1: Architecture snapshot generator
- Detect: entry points, package manifests, dependency graph (basic), key modules
- Generate: `snapshot.json` + `snapshot.md`
- No AI involved yet — pure static analysis and heuristics

**Learning track:**
- Static analysis basics (parsing package.json, tsconfig, imports)
- Pattern detection (what makes a file an "entry point"?)
- Structured output design
- Output normalization

**Research track:**
- Conduct first 5 interviews (engineers and CTOs)
- Log pain signals
- Identify repeated complaints
- Start filling interview log

**Deliverables:**
- [ ] Snapshot generator producing JSON + markdown
- [ ] Interview log v1 (5 conversations)
- [ ] Early ICP signals

### Week 3: Grounded Q&A

**Product track:**
- Level 2: Evidence-backed Q&A
- Implement file chunking (start file-level, evolve later)
- Generate embeddings, store in vector DB (LanceDB or Chroma — evaluate this week)
- Build retrieval pipeline: question → relevant chunks → LLM → answer with citations
- Citations must include: file path, line ranges

**Learning track:**
- Embeddings and vector similarity
- Chunking strategies and tradeoffs
- RAG pipeline architecture
- Hallucination control techniques
- Provider-agnostic LLM wrapper design

**Research track:**
- Complete 10-15 total interviews
- Extract willingness-to-pay signals
- Reach Go/No-Go decision

**Deliverables:**
- [ ] `arch-angel ask "Where is auth handled?"` returns answer with citations
- [ ] Clear ICP defined
- [ ] Validation decision made

### Phase 1 Gate — Go/No-Go Decision (End of Week 3)

**Proceed if:**
- 6+ out of 15 interviewees independently identify the same architectural reliability pain
- 3+ indicate willingness to pay $30+/seat/month
- Clear ICP emerges (e.g. "5-30 person startups with fast-growing repos and no formal architecture docs")
- No dominant competitor already solving the exact wedge

**If criteria not met:**
- Narrow the wedge
- Pivot the pain target
- Reduce scope further
- No ego attachment. Follow the signal.

---

## Phase 2 — Memory + Drift (Weeks 4-6)

**Objective:** Build the differentiated features. Research slows. Build intensifies.

### Week 4: Decision Memory (ADR)

**Product track:**
- Level 3: Decision log system
- Create ADR entries with structured format
- Link ADRs to specific modules/files
- Retrieve relevant ADRs during Q&A (augment retrieval context)

**Learning track:**
- Data modeling for linked documents
- Persistence patterns (JSON file storage, structured frontmatter)
- Product UX thinking — what makes ADRs actually useful vs. ignored?

**Deliverables:**
- [ ] `arch-angel decide add "Why we chose Redis for caching"` → stored and linked
- [ ] ADRs surface in Q&A answers when relevant

### Week 5: Drift Detection

**Product track:**
- Level 4: Drift detection
- Compare current snapshot against previous snapshot
- Highlight changed modules
- Flag when ADR-linked modules changed without an updated ADR
- Generate drift report (markdown)

**Learning track:**
- Versioning and snapshot storage
- Diffing logic and algorithms
- Change detection principles
- Simple rules engines

**Deliverables:**
- [ ] `arch-angel drift` → report showing changes and stale decisions
- [ ] Example: "Payments module changed; decision log not updated."

### Week 6: Evaluation Harness

**Product track:**
- Level 5: Build evaluation framework
- Measure hallucination rate (answers contain info not in codebase)
- Measure citation correctness (cited files actually contain referenced info)
- Measure response consistency (same question → consistent answers)
- Measure architecture recall accuracy (vs. manually verified ground truth)
- Compare all metrics against baseline (vanilla LLM on same repo without arch-angel)

**Learning track:**
- Evaluation framework design
- Failure analysis methodology
- AI reliability metrics
- Quantifying "does this actually work?"

**Deliverables:**
- [ ] Eval harness producing quantified reliability scores
- [ ] Comparison report: arch-angel vs. baseline
- [ ] Identified failure modes with improvement priorities

### Phase 2 Gate — Reliability Threshold (End of Week 6)

- Citation correctness > 85%
- Measurable hallucination reduction vs. baseline
- Drift detection correctly flags 80%+ of ADR-relevant changes
- If not: focus Week 7 on fixing worst failure modes before beta

---

## Phase 3 — Controlled Beta (Weeks 7-9)

**Objective:** Put the tool in real engineers' hands. Observe. Learn. Iterate.

### Beta Setup
- 5-10 engineering teams (from interview contacts + network)
- Provide onboarding support
- Collect failure logs and usage data

### What to Observe
- Where do users get stuck?
- Which features get used vs. ignored?
- What questions do they ask that the tool can't answer?
- Where does retrieval fail?
- Do they trust the citations?

### Metrics to Track

**Primary:**
- Weekly active usage
- Architecture Q&A volume
- Drift detection alerts triggered

**Secondary:**
- Onboarding time reduction (self-reported)
- Self-reported trust score (1-5)

### Iteration Focus
- Improve retrieval precision based on real queries
- Fix citation accuracy issues
- Refine snapshot quality for different repo structures
- Tighten drift detection rules

### Phase 3 Gate — Traction Decision (End of Week 9)

- Users returning weekly without prompting
- At least 3 teams reporting measurable value
- Clear signal on which feature drives retention
- If not: re-evaluate wedge, narrow scope, or pivot

---

## Phase 4 — Monetization (Weeks 10-12)

**Objective:** Turn validated product into revenue.

### Pricing Hypothesis (to test)
- Solo: $29/month
- Team (5 seats): $79-149/month
- Per-seat: $30-50/month
- Alternative: repo-based pricing tiers

### Positioning
- NOT "AI coding agent"
- NOT "AI that replaces engineers"
- IS "Persistent architectural memory for engineering teams"
- Emphasis: reliability, system clarity, drift prevention, evidence-backed answers

### Tasks
- [ ] Define pricing model based on beta feedback
- [ ] Build payment integration (Stripe)
- [ ] Lock ICP based on highest-value beta users
- [ ] Prepare v1 public launch
- [ ] Landing page with clear positioning

### Phase 4 Gate — Monetization Viability (End of Week 12)

- At least 3 paying customers
- Clear understanding of what feature they're paying for
- Sustainable unit economics at current pricing
- If not: adjust pricing, narrow ICP further, or extend beta

---

## Future Horizons (Post-V1)

These are not in scope. They exist so we design V1 without blocking them.

- **Agent loop:** Multi-step reasoning, tool use, automated reports
- **IDE integration:** VS Code extension, Cursor plugin
- **Multi-repo support:** Cross-repo architectural memory
- **Team features:** Shared decision logs, role-based access
- **Python migration:** Move core logic to Python/FastAPI for AI ecosystem alignment
- **Solana integration:** On-chain verification, payments, identity (Phase 4+ of engineering growth)
- **Web dashboard:** Visual architecture maps, drift timeline

---

## Design Constraints

These rules apply across all phases:

1. **CLI-first.** No server, no web UI for V1.
2. **Local-first.** Works on your machine without cloud infra (except LLM API calls).
3. **Single repo scope.** One repo at a time for V1.
4. **Provider-agnostic LLM.** Interface abstraction so we can swap providers.
5. **Incremental processing.** Re-scanning shouldn't re-process unchanged files.
6. **Human-readable output.** Markdown + JSON. No binary blobs.
7. **Reasonable scale.** Handle repos up to ~10k files.

---

## Daily Operating Rhythm

**2 hours minimum daily:**
- 60-90 minutes: building the current level
- 30-45 minutes: research (competitors, pain mining, interviews)
- 15 minutes: documenting (learning log, decisions, tweets)

**Weekly:**
- Ship one level or sub-level
- Write weekly reflection (what built, what broke, what learned)
- Conduct 2 discovery interviews (Phase 1)

**Decision milestones:**
- Week 3: Validation decision
- Week 6: Reliability threshold
- Week 9: Traction decision
- Week 12: Monetization viability
