# Decision Log

This file tracks important product and technical decisions for `Familiens sjakkbrett`.

## Format

- `Decision`: short statement of the decision
- `Status`: proposed, accepted, superseded, deprecated
- `Date`: YYYY-MM-DD
- `Context`: why this came up
- `Decision details`: what we chose
- `Consequences`: what this means going forward

---

## DL-001: AI is for feedback and training, not live opponents

- `Status`: accepted
- `Date`: 2026-04-17

### Context

The app is being shaped first and foremost as a family chess experience. The immediate goal is to
get the family playing together, especially around human-vs-human games on one or more devices.

There is clear value in engine support for:

- post-game feedback
- learning prompts
- hints
- puzzle generation
- training scenarios

At the same time, an AI opponent would add product and engineering complexity that does not support
the current core goal as directly.

### Decision details

For the current product direction:

- all live games are human vs human
- there is no `player vs AI` mode
- engine/AI support is allowed only for:
  - play feedback
  - analysis
  - training
  - puzzles
  - learning scenarios

In practice, this means Stockfish.js may be used as a:

- feedback engine
- hint engine
- training engine

but not as a live gameplay opponent.

### Consequences

- no AI turn loop is needed in the main game flow
- no difficulty-balancing work is needed for engine games
- no “computer thinking” UX is needed for standard games
- the product identity stays focused on family play
- future AI work should prioritize:
  - post-game review
  - tactical training
  - lesson-style scenarios
  - child-friendly coaching

If this changes later, a new decision should be added rather than silently changing the policy.

---

## DL-002: In online games, the challenger plays white

- `Status`: accepted
- `Date`: 2026-04-17

### Context

The app now supports lightweight online games between registered family users. We need one simple,
consistent rule for who gets white and who gets black when a player starts a new online game
against another user.

### Decision details

For online games:

- the player who starts the challenge gets white
- the challenged player gets black
- each player sees their own pieces from the bottom of the board

### Consequences

- online game creation should stay deterministic and easy to understand
- the challenged player should see the board flipped with black at the bottom
- if we later want a fairness model like alternation or random color assignment, it should be
  introduced as a new decision instead of changing this silently
