# STARPOINT WORLD SERIES deployment and acceptance

This branch implements an English-only CS2 community and manual competition workflow. It has not been deployed or tested against the live Discord guild. Keep registration closed until the live acceptance checklist passes.

## Railway deployment

1. Review and merge the pull request, or deploy its branch to a staging service. Never run two copies against the same guild or data file.
2. Attach a persistent Railway volume at `/data`. Set `SWS_DATA_PATH=/data/starpoint/state.json` and `SWS_ENABLED=true`. Use one service replica. Back up this file and retained Discord channels. The atomic JSON store is intended for a single-process initial deployment; use transactional PostgreSQL and durable jobs before horizontal scaling or high-volume operation.
3. Keep `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`, `OWNER_ID`, and existing OAuth/bridge secrets in Railway variables. Do not put them in GitHub. The existing OAuth module is preserved; its in-memory OAuth clients/codes and MCP administrative proposals still have their existing restart limitations.
4. Enable the **Server Members Intent** in the Discord Developer Portal. The bot needs Manage Server (native AutoMod), Manage Roles, Manage Channels, View Channels, Send Messages and Read Message History. Do not grant Administrator merely for setup. Put the bot above the Player, Captain, Verified Member, region and language roles. Existing staff roles can remain above it. Enable Use Application Commands for entry users.
5. Wait for a healthy deployment, then run `/sws-audit` as the configured owner. Inspect all roles and permission overwrites, including preserved staff and legacy payment tickets. The setup stops if legacy channels are visible to @everyone, an unmanaged channel needs review, an access role has nonzero permissions, or names are ambiguous. Existing unrelated roles and privileged staff access require human audit.
6. Run `/sws-setup`. Read the exact preview and click **Confirm STARPOINT setup**. Setup never runs merely on startup. It creates/reuses resources and stores their Discord IDs after each operation so partial setup can be resumed. Do not rename managed roles or move managed channels outside the bot.
7. Assign staff roles manually after reviewing membership. New staff roles start with zero guild permissions; explicit overwrites give them workspace access. Tournament Manager and Administrator role IDs authorize tournament commands in the bot. Referee receives private match access; Support receives private tickets. Caster does not receive private staff access by default. Discord integration command settings can further restrict commands.
8. Refresh the ChatGPT connector's discovered tools to expose the new read-only `inspect_server` action. Existing propose/execute actions remain confirmation gated.

## Implemented workflows

- `/sws-audit`, `/sws-setup`: inspection and explicit owner-confirmed configuration.
- Persistent rule acceptance, single main region and independent language selectors. Global access requires both acceptance and region selection. Old regional roles are removed before new access is added; staff and unrelated roles are retained. Startup and rejoin reconcile managed access roles.
- 12 regional groups with country and territory guide; 246 standard mapped ISO codes plus Kosovo. Antarctica, Bouvet Island, South Georgia & South Sandwich Islands and unlisted locations go to entry support. This is an operational convention; server zones are event-specific.
- `/team create`, `invite`, `accept`, `remove`, `captain`, `roster`: confirmed rosters, pending invitations, private team rooms. Teams can include substitutes in their confirmed roster; separate starter/substitute positions are not yet implemented. DMs are best effort; an invitation can always be accepted by team ID. Active accepted registrations and unarchived matches lock roster changes. Match participants and captains are snapshotted when scheduled.
- `/profile`: self-reported Steam/FACEIT IDs, explicitly unverified.
- `/competition create`: staff specifies region, minimum roster and server/latency policy. `/register` validates rules acceptance, region and confirmed roster. `/competition close` ends registration locks; unarchived matches keep their roster locks. No payment collection or fabricated platform connections.
- `/match-create`: staff selects accepted teams, future ISO start time and optional verified HTTPS link. Creates an on-demand private room with roster members and referees. Persistent 60/15-minute reminders, `/check-in` from 30 minutes before to 30 minutes after start. Recipients see timestamps in their own time zone.
- `/match-result`: only both current captains can submit Team A / Team B scores. Matching reports validate; disagreement creates a dispute status and logs an alert without updating standings. `/result-resolve` requires tournament staff and records actor/reason, including corrections. `/standings` computes only validated or archived scores, 3/1/0 points; regional standings updates are posted after validation. Staff resolves evidence manually.
- Private support button/modal and `/ticket`; regional and competition context recorded, assigned to the shared Support/Tournament Manager pool. `/ticket-close` records all paginated messages and attachment references and keeps the room read-only. `/match-archive` requires a validated result and preserves its history similarly. Attachments are retained in Discord, not downloaded into a backup.
- Native Discord spam and 5-mention protection with alerts to bot-logs. Existing same-trigger AutoMod rules are preserved and logged; their protection must be checked in the audit. No automatic competitive sanctions.

## Live acceptance checklist (pending)

Use separate non-administrative test accounts. Owners and Discord Administrators bypass channel restrictions and cannot validate player privacy.

- New account sees entry only, no global/region/staff/team/ticket history. Check inherited and unrelated role grants too.
- Region selection alone grants no regional/global access. Acceptance plus region unlocks global and exactly that region. Language changes grant no other region or administrative permissions.
- Switch region outside an active event: old access disappears. Register a team in an active event: region change becomes pending. Staff approval changes access and marks affected registration pending; rejection keeps the old access.
- Other users cannot view team rooms, tickets or matches; staff and referees see only appropriate private spaces. Old payment tickets retain their original privacy.
- Accept an invitation, remove a player and transfer captaincy; verify room permissions and Captain/Player roles.
- Register an incomplete team; verify pending requirements. Complete its roster and resubmit; verify acceptance.
- Schedule a match, check timezone rendering, reminders, check-in window and supplied link.
- Submit contradictory captain scores; no standings update. Resolve with evidence and reason; verify audit. Correct a validated result; verify recalculated points.
- Close a ticket/archive a match; verify stored transcript and read-only room. Archive does not delete content.
- Restart Railway; repeat old panel interactions, access reconciliation and pending reminders. Run setup twice; compare IDs and resource counts.
- Test native spam and mention protection with test messages; inspect bot-logs. Check any preserved AutoMod rule manually.

## Remaining production work

Live deployment/testing, external account verification and FACEIT match provisioning, payments, advanced eligibility rules, separate starter/substitute slots, region-specific staff routing, registration competition dropdowns, reopening archived matches, exported attachment backups, dedicated voice match rooms, and multi-replica PostgreSQL/outbox migration. Archived corrections currently require a staff-controlled reopen implementation. No automated disciplinary verdicts are made. This is an initial implementation, not a claim that every requested production feature is active.

Setup preserves existing staff and ticket category names/content/permissions. Legacy names can be translated separately after inspection. English is used for newly managed official content and all new commands/replies. The former Spanish Discord administration commands are replaced by English STARPOINT commands when enabled; MCP and private bridge administrative routes remain available.
