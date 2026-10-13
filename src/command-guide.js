export const commandGuide=`### 📚 STARPOINT command guide

**English is the default language.** Responses to these commands are private unless the bot explicitly publishes a competition, match or standings update. Your region controls which competition standings you can view.

### 👋 Getting started — everyone
• **Region / language panel:** Accept rules and choose one main region in choose-region. Languages can change freely; active competition region changes need review.
• **/help** — Show this guide privately.
• **/profile steam:<ID> faceit:<ID>** — Save your own account identifiers. Both fields are optional. These accounts are self-reported, not externally verified.
• **/ticket** — Open a form for the competition and reason. Creates a private ticket visible to you and the support staff.
• **/ticket-close ticket:<ID>** — Close your own ticket; support staff can also close tickets. History is retained and the room becomes read-only.

### 👥 Teams — complete onboarding first
• **/team create name:<team name>** — Create your team and private room. You become captain. Returns the team ID.
• **/team invite player:@member** — Captain invites a player. Invitations require acceptance; DM delivery is not guaranteed.
• **/team accept team:<team ID>** — Invited player joins the confirmed roster and gains access to the team room.
• **/team roster** — Team members see the team ID, captain, confirmed roster and pending invitations.
• **/team remove player:@member** — Captain removes a player and their team-room access. Transfer captaincy before removing yourself.
• **/team captain player:@member** — Captain transfers leadership to a confirmed team player.
**Roster changes are locked** during accepted active registrations and unarchived matches. Confirmed rosters can include substitutes; separate starting slots are not yet available.

### 📝 Registration & standings
• **/register competition:<ID>** — Captain submits the team. Returns accepted status or the missing roster, onboarding or region requirements. No payment is collected.
• **/standings competition:<ID>** — Members of that competition's region see validated points and matches played. Tournament managers can inspect other regions. Scoring: win 3, draw 1, loss 0.

### 🎮 Matches — scheduled participants
• **/check-in match:<ID>** — Match players check in from 30 minutes before start until 30 minutes after. Confirmation is stored privately.
• **/match-result match:<ID> a:<score> b:<score>** — Scheduled captains submit scores in Team A / Team B order. Both must agree before validation. Disagreement goes to staff; no points are awarded automatically.
**Example:** /match-result match:abcd1234 a:13 b:7
Match IDs, Team A/B order, time and any supplied link appear in the private match room. Times display in your local timezone.

### 🏆 Tournament management — Tournament Manager / Administrator, or configured owner
• **/competition create name:<name> region:<key> zone:<server policy> roster:<minimum>** — Publish an event and its ID. Minimum roster is at least 5; staff supplies the server/latency policy.
• **/competition close competition:<ID>** — Close the event and release registration locks. Unarchived matches retain roster locks.
• **/match-create competition:<ID> a:<team ID> b:<team ID> time:<ISO date> link:<HTTPS URL>** — Schedule accepted teams and create their private room with referee access. Link is optional. Example date: 2027-01-15T20:00:00+01:00.
• **/result-resolve match:<ID> a:<score> b:<score> reason:<reason>** — Resolve or correct a result after human review. Actor and reason are recorded. Archived matches cannot be corrected through this command.
• **/match-archive match:<ID>** — Archive a validated match as read-only and retain its transcript.
• **/region-review player:@member decision:approve** — Approve a pending region change and mark affected active registrations for rechecking. Use decision:reject to retain current access.
Referees have private match access; their role alone does not grant result-resolution commands. Support, Moderator and Referee can close support tickets; other team rooms remain restricted.

### 🛠️ Server maintenance — configured OWNER_ID account only
• **/sws-audit** — Download the live roles/permissions audit JSON. No changes.
• **/sws-recover audit:<JSON attachment>** — Preview missing channel/category ID records from your private audit. Confirm separately; no permission edits during recovery.
• **/sws-setup** — Preview server setup. Confirmation creates/reuses channels and roles, applies managed permissions, updates official panels and configures native AutoMod. Existing staff/payment tickets are preserved.
• **/sws-reset-messages action:preview** — Scan accessible channel history for this bot's own messages, save a private backup and show deletion/repost counts. Confirmation is irreversible; unrelated users and bots are excluded.
• **/sws-reset-messages action:status** — View progress and any blockers. Use action:resume after interruption; action:cancel cancels a preview or pauses a running job after its current message.
Reset preserves channels, roles, teams, tickets, registrations and results. Reposted messages receive new IDs and move to the end of each channel; old links and chronology change. Files are backed up before deletion. New messages sent after the preview are excluded.

### 🔒 What you can see
• Before onboarding: entry channels and your private support ticket.
• After onboarding: global spaces, your region and private spaces you belong to.
• Captains and players: their own team rooms and assigned match rooms.
• Staff: the workspaces allowed for their role. Discord Administrators bypass channel restrictions.
**No FACEIT provisioning, payment integration or automated competitive sanctions are enabled.** Staff verifies external links and eligibility manually.
`;
