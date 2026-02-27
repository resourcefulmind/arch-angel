# Engineering Reference

Detailed engineering standards for later phases. This file is NOT loaded automatically.
Read when working on Solana integration (Phase 4+), frontend features, or when
detailed code style examples are needed.

---

## Solana-Specific Guidance

### Account Model Fundamentals
- Solana is account-based, not UTXO or EVM.
- Programs are stateless; state lives in accounts. Programs can only modify accounts they own.
- PDAs (Program Derived Addresses) are deterministic, off-curve addresses derived from seeds.
- All accounts must be passed explicitly to instructions. No global state lookup.

### Anchor Conventions
- Use `#[account(...)]` macros for validation. Never skip checks.
- Define seeds for PDAs consistently. Document the derivation.
- Use `init_if_needed` sparingly — prefer explicit initialization flows.
- Custom error codes with `#[error_code]`. Make them descriptive.
- Keep instruction handlers focused. Extract logic to helper functions.

### Security Invariants (Non-Negotiable)
1. Validate all accounts — owner checks, PDA derivation, signer requirements.
2. Check signer authority. Never assume — verify.
3. Validate account relationships.
4. Integer overflow/underflow — use checked math.
5. Reinitialization attacks — ensure accounts can't be re-initialized.
6. CPI safety — validate programs you invoke.
7. Rent exemption — ensure accounts have enough lamports.
8. Account data size — verify on reallocations.
9. Sysvar access — use Anchor's wrappers or validate addresses.
10. Clock manipulation — don't rely on slot for precise timing.

### Client-Side Best Practices
- Always simulate transactions before sending.
- Handle RPC failures gracefully. Retry with backoff. Fallback RPCs.
- Use `@solana/wallet-adapter` for connection.
- Preflight checks: balance, blockhash freshness, account existence.
- Deserialize accounts using Anchor's generated types.
- Batch RPC calls with `getMultipleAccountsInfo`.

### Transaction Construction
- Keep transactions under ~1232 bytes.
- Use lookup tables (ALTs) for many-account transactions.
- Set appropriate compute unit limits and priority fees.
- Handle blockhash expiration (~60-90 seconds).
- Confirmation levels: processed < confirmed < finalized.

---

## Frontend Guidance

### Component Architecture
- Functional components only. No class components.
- Composition over inheritance.
- Single responsibility. Split if a component does multiple things.
- Co-locate related code: component, styles, tests, types.

### React Patterns
- Server Components by default (App Router). Client components when needed.
- Lift state only as high as necessary.
- `useCallback`/`useMemo` intentionally, not reflexively.
- Custom hooks for reusable logic: `use[Thing]`.
- Avoid prop drilling beyond 2-3 levels.

### State Management
- URL state: bookmarkable things (filters, pagination, tabs).
- Server state (Tanstack Query): data from APIs/chain.
- Client state (Zustand): UI state not in URL or server.
- Form state (React Hook Form): form inputs.

### Styling
- Tailwind utilities inline with markup.
- `cn()` helper (clsx + tailwind-merge) for conditional classes.
- Shadcn components as base.
- Dark mode from day one.

### Accessibility
- Semantic HTML. ARIA only when necessary.
- Keyboard navigation for all interactive elements.
- Visible focus rings. Logical focus order.
- WCAG 2.1 AA minimum color contrast.

---

## Backend Guidance (Extended)

### API Design
- tRPC for type-safe APIs. Routers by domain.
- Zod for input validation. Fail fast.
- One job per endpoint.

### Database
- Prisma for schema and queries. Migrations for all changes.
- Index based on query patterns.
- Transactions for multi-step operations.
- Avoid N+1 queries.
- Soft delete for user-facing data.

### Background Jobs
- BullMQ for async work.
- Idempotent jobs. Retries shouldn't cause duplicates.
- Dead letter queues. Alert on failures.

### Caching
- Redis for hot data (sessions, rate limits).
- Default to short TTLs unless you have an invalidation strategy.

---

## Design Principles

### Clarity
- Clear primary action per screen.
- Progressive disclosure: simple by default, depth available.

### Feedback
- Every action has visible feedback.
- Loading, success, error states — all explicit.
- Optimistic UI where safe. Confirm destructive actions.

### Consistency
- Same action = same pattern everywhere.
- If breaking consistency, make it obviously intentional.

### Forgiveness
- Undo over confirmation dialogs where possible.
- Destructive actions require explicit confirmation.

---

## Code Style Examples

### TypeScript
```typescript
// Explicit return types on exported functions
export function calculateRewards(stakeAmount: bigint, duration: number): bigint { ... }

// Interfaces for object shapes, types for unions/primitives
interface User { id: string; wallet: PublicKey; createdAt: Date; }
type Status = 'pending' | 'active' | 'closed';

// No `any`. Use `unknown` and narrow.
// Prefer readonly where mutation isn't needed.
// Use const assertions for literal types.
```

### Rust/Anchor
```rust
#[account]
pub struct StakePosition {
    pub owner: Pubkey,
    pub amount: u64,
    pub start_time: i64,
    pub bump: u8,
}

// Use checked math
let new_amount = self.amount.checked_add(deposit).ok_or(StakeError::Overflow)?;
```

---

## Workflow Standards

### Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: step back and implement the clean solution knowing everything you know now.
- Skip this for simple, obvious fixes — don't over-engineer.
- Challenge your own work before presenting it.

### Autonomous Bug Fixing
- When given a bug report: fix it. Don't ask for hand-holding.
- Point at logs, errors, failing tests — then resolve them.
- Zero context switching required from the user.
- Fix failing CI tests without being told how.

### Core Principles
- **Simplicity first:** Make every change as simple as possible. Minimal code impact.
- **No laziness:** Find root causes. No temporary fixes. Senior developer standards.
- **Minimal impact:** Changes should only touch what's necessary. Avoid introducing bugs.

---

## Review Checklist

### Security
- [ ] All accounts validated (owner, signer, PDA derivation)
- [ ] No unchecked arithmetic
- [ ] User input sanitized
- [ ] Proper authorization checks
- [ ] No sensitive data in logs or client bundles

### Correctness
- [ ] Handles edge cases (empty, null, max, concurrent)
- [ ] Error states handled and surfaced clearly
- [ ] Matches spec/requirements
- [ ] Tested (unit, integration as appropriate)

### Quality
- [ ] Readable without comments
- [ ] No dead code or TODOs without tickets
- [ ] Follows codebase conventions
- [ ] Types are accurate (no `any` escapes)
- [ ] Performance considered for hot paths
