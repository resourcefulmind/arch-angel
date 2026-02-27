# SPEC — arch-angel V1

Technical specification for arch-angel V1.
This document defines what we build, how it works, and why each decision was made.
Updated as levels are completed. Versioned.

**Spec version:** 0.1.0
**Last updated:** 2026-02-25

---

## Product Definition

**One sentence:** A CLI tool that gives engineering teams persistent architectural memory for their codebases.

**What it does:**
1. Scans a repo and produces a structured file tree with metadata.
2. Generates an architecture snapshot (entry points, dependencies, key modules).
3. Answers questions about the codebase with evidence-backed citations.
4. Stores design decisions (ADRs) linked to specific modules.
5. Detects architectural drift when code changes conflict with decisions.
6. Measures its own reliability (hallucination rate, citation accuracy).

**What it does NOT do (V1):**
- No IDE plugin or editor integration.
- No web UI or dashboard.
- No multi-repo support.
- No agent loop or autonomous actions.
- No real-time watching or hooks.
- No team/collaboration features.
- No hosted service — runs locally only.

---

## CLI Interface

### Commands

```
arch-angel scan <path>                  # Scan repo, output file tree + metadata
arch-angel snapshot <path>              # Generate architecture snapshot
arch-angel index <path>                 # Chunk + embed files for Q&A
arch-angel ask <question>               # Ask a question about the indexed repo
arch-angel decide add "<title>"         # Add a design decision (ADR)
arch-angel decide list                  # List all decisions
arch-angel decide show <id>             # Show a specific decision
arch-angel drift                        # Compare current vs. previous snapshot
arch-angel eval                         # Run evaluation harness
arch-angel config set <key> <value>     # Set configuration
arch-angel config show                  # Show current configuration
```

> **Why separate scan, snapshot, and index?**
> Each maps to a build level and a distinct skill. `scan` works on Day 1 with
> zero dependencies. `snapshot` adds analysis. `index` adds AI. A user who only
> wants a repo overview never needs to configure an LLM. Separation also means
> each command is independently testable and useful.

### Global Flags

```
--output <file>    Write output to file instead of console
--json             Machine-readable JSON output (where applicable)
--verbose          Show detailed progress information
--quiet            Suppress all output except errors
--help             Show help for any command
```

### Exit Codes

```
0    Success
1    User error (bad arguments, missing path, invalid config)
2    System error (file system failure, permission denied)
3    LLM error (API failure, rate limit, invalid key)
```

> **Why explicit exit codes?**
> CLI tools that only return 0 or 1 are useless in scripts. Distinct codes let
> users (and CI pipelines) react differently to "you typed it wrong" vs.
> "the API is down." Three categories cover every failure mode we'll hit.

---

## Data Storage

### Storage Location

All arch-angel data lives inside the scanned repo:

```
<repo>/
  .arch-angel/
    config.json         # Local configuration
    scans/
      latest.json       # Most recent scan result
    snapshots/
      <timestamp>.json  # Versioned snapshots
      latest.json       # Symlink or copy of most recent
    index/
      chunks.json       # Chunked file data
      embeddings/       # Vector index files (format depends on DB choice)
    decisions/
      001-why-we-chose-redis.md
      002-auth-architecture.md
    evals/
      <timestamp>.json  # Evaluation results
```

> **Why inside the repo (.arch-angel/)?**
> Three reasons. (1) The data is specific to this repo — it doesn't belong in a
> global directory. (2) It can be gitignored or committed, user's choice. (3) When
> you `cd` into a project, arch-angel finds its data automatically — no path config
> needed. This is how tools like `.git/`, `.vscode/`, and `.next/` work.

> **Why not a global data directory?**
> Global directories (like `~/.arch-angel/`) create path mapping problems when you
> work on multiple repos. "Which scan belongs to which repo?" becomes a headache.
> Local-first is simpler.

### .gitignore Recommendation

When initialized, arch-angel adds to `.gitignore`:

```
# arch-angel (local analysis data)
.arch-angel/scans/
.arch-angel/index/
.arch-angel/evals/
```

But NOT:
```
# These CAN be committed (shared team knowledge)
# .arch-angel/config.json
# .arch-angel/snapshots/
# .arch-angel/decisions/
```

> **Why this split?**
> Scans, indexes, and evals are machine-generated and large — they regenerate.
> Snapshots and decisions are human-curated knowledge — they have value to the team.
> Giving users the choice to commit shared knowledge is a feature, not a bug.

---

## Data Formats

### Scan Result (scans/latest.json)

```json
{
  "version": "1",
  "timestamp": "2026-02-25T10:30:00Z",
  "root": "/path/to/repo",
  "tree": {
    "name": "repo-name",
    "path": ".",
    "type": "directory",
    "children": [
      {
        "name": "src",
        "path": "src",
        "type": "directory",
        "children": [
          {
            "name": "index.ts",
            "path": "src/index.ts",
            "type": "file",
            "extension": ".ts",
            "sizeBytes": 1240
          }
        ]
      }
    ]
  },
  "stats": {
    "totalFiles": 127,
    "totalDirectories": 23,
    "languages": {
      ".ts": 84,
      ".json": 12,
      ".md": 8,
      ".css": 5
    },
    "totalSizeBytes": 542800
  }
}
```

> **Why include a version field?**
> When we change the format later (and we will), the version field tells us how
> to parse it. Without it, old data silently breaks. This is cheap insurance.

### Architecture Snapshot (snapshots/<timestamp>.json)

```json
{
  "version": "1",
  "timestamp": "2026-02-25T10:35:00Z",
  "root": "/path/to/repo",
  "entryPoints": [
    {
      "file": "src/cli/index.ts",
      "reason": "bin field in package.json"
    }
  ],
  "packageInfo": {
    "name": "arch-angel",
    "version": "0.1.0",
    "dependencies": {},
    "devDependencies": {
      "typescript": "^5.9.3"
    }
  },
  "keyModules": [
    {
      "path": "src/scanner",
      "purpose": "Repository scanning and file tree generation",
      "fileCount": 3
    }
  ],
  "dependencyGraph": {
    "src/cli/index.ts": ["src/scanner/index.ts"],
    "src/scanner/index.ts": ["src/core/types.ts"]
  },
  "detectedPatterns": {
    "framework": "none",
    "language": "typescript",
    "packageManager": "pnpm",
    "testFramework": "vitest",
    "structure": "domain-based"
  }
}
```

> **Why JSON and not just markdown?**
> Snapshots serve two purposes: human reading (markdown) and machine comparison
> (drift detection). JSON is diffable, parseable, and queryable. We generate
> a markdown summary FROM the JSON — the JSON is the source of truth.

### Snapshot Markdown (snapshots/<timestamp>.md)

Auto-generated from the JSON. Human-readable summary:

```markdown
# Architecture Snapshot — arch-angel
Generated: 2026-02-25

## Entry Points
- `src/cli/index.ts` (bin field in package.json)

## Key Modules
- **src/scanner** — Repository scanning and file tree generation (3 files)

## Dependencies
- typescript ^5.9.3 (dev)

## Detected Patterns
- Language: TypeScript
- Package manager: pnpm
- Test framework: vitest
- Structure: domain-based
```

### ADR Format (decisions/NNN-title.md)

```markdown
---
id: 1
title: Why we chose JSON files over SQLite for V1 storage
status: accepted
date: 2026-02-25
modules: [core, scanner]
tags: [storage, architecture]
---

## Context
We needed a storage mechanism for scan results, snapshots, and decisions.

## Decision
JSON files stored in .arch-angel/ directory within the repo.

## Rationale
- No external dependencies (no DB server)
- Human-readable and editable
- Git-friendly (can be committed)
- Sufficient for V1 scale (~10k files)

## Consequences
- Will need migration path if we move to SQLite later
- No query capability beyond file reads
- Large repos may produce large JSON files
```

> **Why markdown with YAML frontmatter?**
> Engineers already know this format (it's how most static site generators, docs
> tools, and ADR tools work). The frontmatter is machine-parseable for linking
> and retrieval. The body is human-readable. No new format to learn.

> **Why numbered filenames (001-, 002-)?**
> Natural ordering in file explorers and `ls`. You see decisions in the order
> they were made. Simple incrementing counter, no UUID complexity.

### ADR Status Lifecycle

```
proposed → accepted → [deprecated | superseded]
```

> **Why these four states?**
> `proposed` = under discussion, not final. `accepted` = this is how we do it.
> `deprecated` = no longer relevant (tech removed). `superseded` = replaced by
> a newer decision (link to it). This covers every real-world scenario without
> over-complicating things.

---

## Configuration

### Config File (.arch-angel/config.json)

```json
{
  "llm": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-6",
    "apiKeyEnv": "ANTHROPIC_API_KEY"
  },
  "embedding": {
    "provider": "openai",
    "model": "text-embedding-3-small",
    "apiKeyEnv": "OPENAI_API_KEY"
  },
  "scan": {
    "ignore": ["node_modules", ".git", "dist", "build", "coverage", ".next"],
    "maxFileSizeBytes": 1048576,
    "respectGitignore": true
  },
  "retrieval": {
    "chunkStrategy": "file",
    "maxChunksReturned": 10,
    "similarityThreshold": 0.7
  }
}
```

### Environment Variables

```
ANTHROPIC_API_KEY     # Anthropic API key
OPENAI_API_KEY        # OpenAI API key (used for embeddings)
ARCH_ANGEL_VERBOSE    # Set to "true" for verbose output
```

> **Why separate LLM and embedding providers?**
> Best-in-class embeddings and best-in-class reasoning don't always come from
> the same provider. OpenAI's text-embedding-3-small is cheap and effective for
> embeddings. Anthropic's Claude is strong for reasoning. This lets us use the
> best tool for each job without lock-in.

### Config Precedence

```
Environment variables > .arch-angel/config.json > built-in defaults
```

> **Why this order?**
> Environment variables are the standard for secrets (API keys) and CI overrides.
> Config file handles project-specific preferences. Defaults ensure the tool
> works out of the box for scan/snapshot without any configuration at all.

### Defaults (zero config)

These commands work with NO config file and NO API keys:
- `arch-angel scan <path>`
- `arch-angel snapshot <path>`
- `arch-angel decide add/list/show`
- `arch-angel drift`

These commands REQUIRE configuration:
- `arch-angel index <path>` (needs embedding API key)
- `arch-angel ask <question>` (needs LLM + embedding API keys)
- `arch-angel eval` (needs LLM + embedding API keys)

> **Why this split?**
> A user should be able to install arch-angel, run `scan` and `snapshot`, and
> get immediate value with zero friction. API key setup only happens when they
> want AI features. This lowers the barrier to adoption and lets the non-AI
> features stand on their own.

---

## Scanning Rules

### Included by Default
- All text files under the repo root
- Respects `.gitignore` patterns when `respectGitignore: true`

### Excluded by Default
- `node_modules/`, `.git/`, `dist/`, `build/`, `coverage/`, `.next/`, `.arch-angel/`
- Binary files (detected by extension: images, compiled outputs, archives)
- Files over `maxFileSizeBytes` (default: 1MB)
- Symlinks (followed = security risk, skip with warning)

### Binary File Extensions (skipped)
```
.png .jpg .jpeg .gif .svg .ico .woff .woff2 .ttf .eot
.zip .tar .gz .rar .7z
.exe .dll .so .dylib
.pdf .doc .docx .xls .xlsx
.mp3 .mp4 .avi .mov
.sqlite .db
```

> **Why 1MB max file size?**
> Files over 1MB are almost always generated (bundles, lock files, data dumps).
> They add noise, slow scanning, and would eat embedding tokens. 1MB is generous
> enough to include any real source file.

> **Why not follow symlinks?**
> Symlinks can create infinite loops (a → b → a) or point outside the repo.
> Following them is a security and performance risk. We skip with a warning
> so the user knows.

### Encoding
- UTF-8 only. Non-UTF-8 files are skipped with a warning.

> **Why UTF-8 only?**
> Modern source code is UTF-8. Supporting legacy encodings (Latin-1, Shift-JIS)
> adds complexity with near-zero benefit. Skip and warn is the right tradeoff.

---

## LLM Integration

### Provider Abstraction

All LLM interaction goes through a single interface:

```typescript
interface LLMProvider {
  complete(prompt: string, options?: LLMOptions): Promise<LLMResponse>;
}

interface LLMOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

interface LLMResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
  };
}
```

> **Why this abstraction?**
> We swap providers by implementing this interface. No LLM-specific code leaks
> into business logic. When Anthropic releases a better model, or OpenAI drops
> pricing, switching is a config change — not a rewrite.

### Prompt Strategy

Q&A prompts follow this structure:

```
System: You are an expert at understanding software architecture.
        Answer based ONLY on the provided code context.
        If the answer is not in the context, say "I don't have enough context."
        Always cite specific file paths and line numbers.

Context: [retrieved chunks with file paths and line numbers]

Question: [user's question]
```

> **Why "ONLY on the provided context"?**
> This is the core of hallucination control. Without this constraint, the LLM
> will happily make up plausible-sounding architecture that doesn't exist in the
> repo. Grounding in retrieved context is what makes arch-angel reliable.

### Error Handling

- **Invalid API key:** Clear message with instructions to set the env var.
- **Rate limited:** Retry with exponential backoff (max 3 retries, 1s → 2s → 4s).
- **API timeout:** 30 second timeout. Fail with clear message suggesting retry.
- **API down:** Fail with message. No infinite retry. Suggest checking provider status.
- **Token limit exceeded:** Reduce context chunks and retry once. If still too large, fail with message suggesting a smaller question scope.

> **Why max 3 retries?**
> Enough to handle transient failures. More than 3 means the problem isn't
> transient — it's structural. Failing fast with a clear message respects the
> user's time.

---

## Embedding & Retrieval

### Chunking Strategy

**Phase 1 (Level 2): File-level chunking.**
- Each file = one chunk (up to max file size)
- Simple, fast, easy to cite (file path = citation)
- Weakness: large files create oversized chunks

**Phase 2 (future improvement): Function/class-level chunking.**
- Parse AST to split files at function/class boundaries
- Better retrieval precision
- More complex to implement
- Introduced when file-level proves insufficient

> **Why start with file-level?**
> It works, it's simple, and citations are trivially accurate (the whole file
> is the context). We upgrade when real-world usage shows us file-level isn't
> precise enough. Premature optimization of chunking is a common RAG mistake.

### Embedding Model

Default: `text-embedding-3-small` (OpenAI)
- 1536 dimensions
- Cheap ($0.02 per 1M tokens)
- Good quality for code retrieval

> **Why OpenAI for embeddings even though we use Anthropic for reasoning?**
> OpenAI's embedding models are the industry standard for vector search.
> They're cheap, fast, and well-supported by every vector DB. Anthropic doesn't
> offer a standalone embedding API. Use the best tool for each job.

### Vector Storage

**V1: LanceDB (embedded)**
- No server required. Runs as a library.
- Stores vectors as files in `.arch-angel/index/`
- Fast similarity search
- Handles our scale (~10k files)

> **Why LanceDB over Chroma?**
> Both are embeddable (no server). LanceDB is more lightweight, stores data as
> efficient columnar files, and has strong Node.js/TypeScript support. Chroma
> works but adds more complexity. We evaluate during Level 2 and can swap if needed.
> If neither works well, we fall back to a simple cosine similarity implementation
> over flat JSON — it's fine at our scale.

### Retrieval Parameters

- **maxChunksReturned:** 10 (default). Top-10 most similar chunks to the question.
- **similarityThreshold:** 0.7 (default). Chunks below this similarity are excluded.
- **Context assembly:** Retrieved chunks are joined with file path headers and line numbers, then passed to the LLM.

> **Why 10 chunks and 0.7 threshold?**
> 10 chunks gives the LLM enough context without flooding it. 0.7 is a standard
> starting threshold that filters out irrelevant matches. Both are configurable —
> we tune based on eval results in Level 5.

---

## Drift Detection

### What Counts as Drift

Drift is detected by comparing two snapshots:

1. **Structural drift:** New modules added, modules removed, entry points changed.
2. **Decision-linked drift:** A module referenced by an ADR has changed, but the ADR hasn't been updated.
3. **Dependency drift:** New dependencies added or removed.

### Comparison Algorithm

```
1. Load previous snapshot (snapshots/latest.json)
2. Generate current snapshot
3. Diff key modules (added, removed, changed)
4. Diff entry points
5. Diff dependency graph
6. Cross-reference changed modules against ADR links
7. Flag ADRs where linked modules changed after ADR date
8. Generate drift report (markdown + JSON)
```

> **Why snapshot-based comparison instead of git diff?**
> Git diff shows line-level changes. We care about architectural changes —
> "was a module added?", "did the dependency graph change?", "is this decision
> still current?" Snapshot comparison works at the right level of abstraction.
> We can always add git-level detail later.

### Drift Report Format

```markdown
# Drift Report — 2026-03-15

## Structural Changes
- **Added:** src/retrieval/ (new module, 4 files)
- **Changed:** src/scanner/ (2 files modified)
- **Removed:** none

## Decision Alerts
- ⚠️ ADR #001 "Why we chose JSON storage" links to src/core/
  src/core/ was modified on 2026-03-14. ADR last updated 2026-02-25.
  → Review if decision is still current.

## Dependency Changes
- **Added:** lancedb ^0.4.0
- **Removed:** none
```

---

## Error Handling Contract

Every error message follows this structure:

```
Error: [what went wrong]
Reason: [why it happened]
Fix: [what to do about it]
```

Example:
```
Error: Cannot index repository.
Reason: ANTHROPIC_API_KEY environment variable is not set.
Fix: Run `export ANTHROPIC_API_KEY=your-key` or add it to .arch-angel/config.json
```

> **Why this three-part structure?**
> Most CLI tools say "Error: something failed" and leave you guessing. The
> three-part structure (what/why/fix) means users never get stuck. This is the
> kind of detail that separates production-grade from hobby project.

### Graceful Degradation

| Situation | Behavior |
|-----------|----------|
| No config file | Use defaults. Scan and snapshot work. |
| No LLM API key | Scan, snapshot, decide, drift work. Ask and eval fail with clear message. |
| No embedding API key | Same as above. Index fails with clear message. |
| API rate limited | Retry 3x with backoff, then fail with message. |
| Repo too large (>10k files) | Warn but proceed. May be slow. |
| Non-UTF-8 file found | Skip file, warn, continue scanning. |
| Binary file found | Skip file silently (expected behavior). |
| Symlink found | Skip, warn once. |
| Empty repository | Succeed with empty results. Not an error. |
| No previous snapshot (drift) | Inform user this is the first snapshot. No drift to report. |

---

## Security

### Data Privacy

- **What stays local:** Scan results, snapshots, ADRs, drift reports, config.
- **What leaves the machine:** File chunks sent to embedding API. Retrieved chunks + question sent to LLM API.
- **Never sent:** API keys, .env files, credential files, binary files.

### Auto-Excluded from Scanning and Embedding

```
.env, .env.*, *.pem, *.key, *.cert, *.secret
credentials.json, secrets.json, service-account.json
id_rsa, id_ed25519, *.pub (SSH keys)
```

> **Why auto-exclude these?**
> If a user accidentally has secrets in their repo, we must not send them to an
> external API. This is a safety net, not a replacement for proper .gitignore.
> Better to miss a file than to leak a key.

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Scan time (1k files) | < 2 seconds | Pure file system traversal |
| Scan time (10k files) | < 10 seconds | Upper bound for V1 |
| Snapshot generation | < 5 seconds (1k files) | Static analysis, no LLM |
| Indexing (embedding) | Depends on API | Rate limited by provider |
| Q&A response | < 10 seconds | Retrieval + LLM completion |
| Drift comparison | < 3 seconds | JSON diffing |

> **Why define targets?**
> Without targets, "it's a bit slow" has no meaning. These give us concrete
> numbers to test against. If scan takes 30 seconds for 1k files, something
> is wrong and we know to investigate.

---

## Testing Strategy

### Per-Level Testing

| Level | What to Test | Method |
|-------|-------------|--------|
| 0 | Scanner produces correct tree, respects ignores, handles edge cases | Unit tests with fixture repos |
| 1 | Snapshot detects entry points, dependencies, modules correctly | Unit tests with known repo structures |
| 2 | Retrieval returns relevant chunks, citations are accurate | Integration tests with fixture repo + mocked LLM |
| 3 | ADRs create/read/link correctly, augment retrieval | Unit tests for CRUD, integration for retrieval augmentation |
| 4 | Drift correctly identifies changes and stale ADRs | Unit tests comparing known snapshot pairs |
| 5 | Eval metrics are computed correctly, baseline comparison works | Integration tests with known-answer repo |

### Test Fixtures

A set of small, purpose-built repos in `tests/fixtures/`:

```
tests/fixtures/
  simple-node/        # Basic Node.js project (10-20 files)
  typescript-app/     # TypeScript project with clear architecture
  empty-repo/         # Edge case: empty directory
  large-flat/         # Many files, flat structure
  deep-nested/        # Deeply nested directories
  binary-mixed/       # Mix of source and binary files
  no-package-json/    # Repo without standard package manifest
```

> **Why fixture repos?**
> Testing against real repos is flaky — they change. Fixtures give us controlled
> inputs with known expected outputs. We can assert "this fixture should produce
> exactly this snapshot." Deterministic tests catch regressions.

---

## Architectural Decisions Log

Decisions made during spec design. These are the "why" behind this document.

### Decision 1: JSON files over SQLite for V1 storage
- **Context:** Needed storage for scans, snapshots, decisions.
- **Choice:** JSON files in `.arch-angel/` directory.
- **Rationale:** No external dependencies. Human-readable. Git-friendly. Sufficient at V1 scale.
- **Tradeoff:** No query capability. Large repos may produce large files. Migration needed if we outgrow it.

### Decision 2: Separate scan/snapshot/index commands
- **Context:** Could combine scanning, analysis, and indexing into one command.
- **Choice:** Keep them separate.
- **Rationale:** Maps to build levels. Each is independently useful and testable. Scan works offline. Users who don't need AI features never touch index/ask.
- **Tradeoff:** More commands to learn. Slightly more friction for the "do everything" case.

### Decision 3: File-level chunking first
- **Context:** RAG systems need to split code into chunks for embedding.
- **Choice:** Start with file = one chunk.
- **Rationale:** Simplest implementation. Citations are trivially accurate (cite the file). Upgrade to AST-based when needed.
- **Tradeoff:** Large files create oversized chunks. Retrieval precision is lower than function-level chunking.

### Decision 4: LanceDB for vector storage
- **Context:** Need vector similarity search for retrieval.
- **Choice:** LanceDB (embedded, serverless).
- **Rationale:** No server dependency. Lightweight. Good TypeScript support. Files stored locally.
- **Tradeoff:** Less mature than Postgres+pgvector. Evaluate during Level 2, swap if needed.

### Decision 5: Separate LLM and embedding providers
- **Context:** Could use one provider for everything.
- **Choice:** OpenAI for embeddings, Anthropic for reasoning.
- **Rationale:** Best tool for each job. OpenAI embeddings are cheap and effective. Claude is strong at grounded reasoning. Abstraction layer makes switching trivial.
- **Tradeoff:** Two API keys to manage. Two providers to monitor.

### Decision 6: .arch-angel/ directory inside the repo
- **Context:** Where should arch-angel store its data?
- **Choice:** Inside the scanned repo as `.arch-angel/`.
- **Rationale:** Data is repo-specific. Auto-discovered when you enter the project. Can be partially committed (decisions, snapshots). Follows convention (.git, .vscode).
- **Tradeoff:** Adds a directory to every scanned repo. Users must gitignore generated data.

### Decision 7: Markdown + YAML frontmatter for ADRs
- **Context:** Need a format for design decision documents.
- **Choice:** Markdown files with YAML frontmatter.
- **Rationale:** Engineers already know this format. Machine-parseable frontmatter for linking and search. Human-readable body. Works in any text editor and renders on GitHub.
- **Tradeoff:** No enforced schema (user can write anything in the body). Frontmatter parsing needed.

### Decision 8: Provider-agnostic LLM interface
- **Context:** LLM landscape is volatile. Pricing, quality, and availability change fast.
- **Choice:** Single `LLMProvider` interface that all providers implement.
- **Rationale:** Switching providers is a config change, not a code change. Protects against provider outages, price hikes, or quality regressions.
- **Tradeoff:** Lowest common denominator — can't use provider-specific features without extending the interface.

### Decision 9: Three-part error messages (what/why/fix)
- **Context:** CLI error messages are notoriously unhelpful.
- **Choice:** Every error includes what happened, why, and how to fix it.
- **Rationale:** Users never get stuck. Reduces support burden. Signals production quality.
- **Tradeoff:** More work to write every error message. Worth it.

### Decision 10: Offline-first for non-AI features
- **Context:** Could require API keys for everything.
- **Choice:** Scan, snapshot, decide, and drift work with zero configuration and zero API keys.
- **Rationale:** Lowers adoption barrier. Proves value before asking for API keys. Non-AI features are genuinely useful standalone.
- **Tradeoff:** Users may not discover AI features. Solved with good help text and onboarding.
