## Socket Test Fix Pattern (DO NOT FORGET)

When fixing socket tests (Vitest + Socket.IO), always apply these steps to avoid race conditions, missed events, and timeouts:

1. **Attach event listeners before emitting any events.**
   - Use `.once` for single-event listeners to avoid multiple handler calls.
2. **Emit context/join events, then add a short delay (e.g., `await new Promise(resolve => setTimeout(resolve, 100));`).**
   - This gives the server time to process context and join events before further actions.
3. **Add debug logging for all key client-side and server-side events and emits.**
   - Helps trace event flow and confirm events are sent/received as expected.
4. **Disconnect clients after each test to avoid lingering connections.**

**Example (see buildActionEvent.test.ts):**
```typescript
clientSocket.once('server:game_state_update', (data) => { /* ... */ });
await new Promise(resolve => setTimeout(resolve, 100));
clientSocket.emit('client:build_item', payload);
```

**If you forget these, you will waste hours debugging the same race conditions.**

**ALWAYS update this section if the pattern changes.**
# Socket Integration Test Debugging & Fix Workflow

For every socket test, follow this process:
1. Ensure an in-memory HTTP and Socket.IO server is started in beforeAll, listening on the correct port.
2. Use Array.from(socket.rooms) to find the correct room for event emission (not Object.keys()).
3. Add debug logging to both server handlers and client event listeners to trace event flow.
4. Confirm that all expected events are emitted and received by the client.
5. If a test times out, check for event emission issues, room lookup bugs, or missing handlers.
6. Remove debug logs after confirming tests pass.

This process must be repeated for every socket test to ensure reliable event-driven integration testing.
# Backend TODO for Catan Game

This file tracks all critical backend features needed for a complete, interactive Catan UI.

## Core Features Checklist
  
## Additional Rules & Edge Cases To Cover


 [x] Full game state persistence (save/load game state per room)
    - [x] Roll dice (with server-side validation and result broadcast)
    - [x] Build (road, settlement, city) with rule enforcement
    - [x] Buy/play development cards
    - [x] Move robber and handle resource stealing
    - [x] Maritime and domestic trading (offer, accept, reject)
    - [x] Socket.IO events for all game actions and state changes
    - [x] Player join/leave notifications
    - [x] Game log/chat events


- [x] Longest Road tiebreaker (no points if tied)
- [x] Largest Army tiebreaker (no points if tied)
- [x] Victory Point card handling (secret until game end)
- [x] Port usage restrictions (must have settlement/city on port)
- [x] Initial placement edge cases (second settlement, adjacent road)
- [x] Piece limits edge cases (cannot build beyond limits)
- [x] Victory Point card secrecy (cannot play, only reveal at game end)
- [x] Discard rounding (half, round down)
- [x] Failed steal (robber: no resource if target has none)
- [x] Invalid build/trade (insufficient resources, action invalid)

- [x] Health/status endpoints (for UI health checks)
- [x] Room management (create, join, leave)
- [x] Game start and initial state
- [x] Turn advancement (basic)
- [x] Full game state persistence (save/load game state per room)
    - [x] Roll dice (with server-side validation and result broadcast)
    - [x] Build (road, settlement, city) with rule enforcement
    - [x] Buy/play development cards
    - [x] Move robber and handle resource stealing
    - [x] Maritime and domestic trading (offer, accept, reject)
    - [x] Socket.IO events for all game actions and state changes
    - [x] Player join/leave notifications
    - [x] Game log/chat events

- [x] Initial board/number/port randomization and validation (no adjacent 6/8s)
- [x] Initial placement phase (snake order, road/settlement rules)
- [x] Piece limits (enforced in build logic)
- [x] Largest army/longest road logic (award/revoke, edge cases)
- [x] Bank resource limits and scarcity rule *(fully enforced and tested)*
- [x] Discarding on 7 (if >7 cards)
- [x] No “free” trades (must always be resource for resource)
- [x] No playing dev card just purchased
- [x] Only one dev card played per turn
- [x] Game end detection (immediate win at 10+ points)
- [x] Robber cannot be placed on same hex
- [x] Game end detection (immediate win at 10+ points)
- [x] Robber cannot be placed on same hex

**Prioritize next:**


- [x] Robber cannot be placed on same hex
  
## Newly Identified Edge Cases & Rules To Cover

- [x] Settlement placement blocked: What happens if a player cannot legally place a settlement during initial placement? (Test: Simulate a blocked board and verify correct handling—skip, error, or alternate rule.)
- [x] Road building interruption: If a player’s road is interrupted by another player’s settlement/city, longest road calculation must break the road. (Test: Build a road network, interrupt it, and verify longest road recalculation.)
- [x] Largest Army/Longest Road loss: If a player loses largest army/longest road, points must be revoked immediately. (Test: Award, then revoke, and verify VP adjustment.)
- [x] No trading during initial placement: Trading is not allowed until after initial placement phase. (Test: Attempt trade during initial placement and verify rejection.)
- [x] No building during other player’s turn: Only the active player may build, except for special card effects. (Test: Attempt build out of turn and verify rejection.)
- [ ] Maritime trade restrictions: Must have settlement/city on port to use its rate; otherwise, default 4:1 applies. (Test: Attempt port trade without settlement/city and verify rejection.)
- [ ] Development card type enforcement: Monopoly, Year of Plenty, Road Building must follow specific rules (e.g., Road Building must build two roads). (Test: Play each card and verify correct behavior.)
- [ ] No building on water/sea hexes: Settlements/cities cannot be placed on water/sea hexes. (Test: Attempt to build on water and verify rejection.)
- [ ] No building on occupied intersections: Cannot build on an intersection already occupied by another player. (Test: Attempt to build on occupied intersection and verify rejection.)
- [ ] No resource stealing from self: Cannot steal a resource from yourself when moving the robber. (Test: Attempt to steal from self and verify rejection.)
- [ ] No trading with bank for dev cards: Dev cards can only be bought, not traded for. (Test: Attempt to trade for dev card and verify rejection.)
- [x] Resource production blocked by robber
- [x] No trading with self
- [ ] Special Building Phase: After each player’s turn, all other players may build (but not trade or play dev cards). (Test: Simulate special building phase and verify only building is allowed.)
- [ ] No trading or dev card play during special building phase. (Test: Attempt trade/dev card play during special building phase and verify rejection.)
### Socket Integration Test Modularization Progress
- [x] Extract "Discarding on 7 (if >7 cards)" tests
- [x] Extract "Trading Events" tests
- [x] Extract "Only One Dev Card Played Per Turn" tests
- [x] Extract "No Playing Dev Card Just Purchased" tests
- [x] Extract "Initial Placement Phase (Snake Order)" tests
- [x] Extract "Robber Movement and Resource Stealing" tests
- [x] Extract "Game End Detection (Immediate Win at 10+ Points)" tests
- [x] Extract "Bank Resource Limits & Scarcity Rule" tests
- [x] Extract "Dice Roll Event" tests
- [x] Extract "Build Action Event" tests
- [x] Extract "Game State Persistence (Save/Load)" tests
- [x] Extract "Player Join/Leave Notifications" tests
- [x] Extract "Connection Handling" tests
- [x] Extract "Game Event Handling" tests
- [x] Extract "Multiple Client Connections" tests
- [x] Extract "Error Handling" tests
- [x] Clean up any remaining shared setup/teardown logic
- [x] Run the full test suite and verify all tests pass
- [x] Update BACKEND_TODO.md to reflect progress
