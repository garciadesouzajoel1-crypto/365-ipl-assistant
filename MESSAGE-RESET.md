# Approved message-only reset

Deploy this change before using the new commands. The owner chose a reset of **365's own server messages**, retaining channels, roles, teams, registrations, results and tickets. No messages are deleted by startup, deployment or creating the preview.

1. As the configured OWNER_ID, run `/sws-reset-messages action:preview`.
2. The bot creates/reuses its registered global `commands` channel, then scans accessible server channels plus active and archived threads. Scanning or attachment backup failures stop before any message deletion. The bot must be able to enumerate private archived threads. Keep one running replica and the persistent volume mounted.
3. Read the deletion count and affected-channel count. Originals and supported attachments are saved privately beside the persistent state file. Downloadable attachments up to 25 MB are backed up; unsupported messages/files cause a pre-deletion stop. Do not publish that backup or the audit in GitHub.
4. Click **Delete and repost bot messages** within 10 minutes. The confirmation rechecks channel permissions and original message identity/content/edit timestamps. Only the owner's previewed message IDs authored by this bot are eligible. User messages, other bots, webhook messages, system events and new messages sent after preview are excluded.
5. Monitor `/sws-reset-messages action:status`. Dynamic messages are reposted; known official panels are regenerated from current templates. Buttons, supported files and pinned dynamic messages are retained. The original Discord IDs and chronology cannot be preserved: deleted message links break and reposts appear at the end of the channel. No competition outcomes or team/ticket state are reset.
6. Use action:cancel to cancel the preview or pause an active job after its current message; deletion already performed is not undone. Use action:resume after interruption. Checkpoints live on the persistent volume. If a send was interrupted before its new ID was recorded, the bot stops and requires staff inspection instead of guessing and creating a duplicate; resolving such an uncertain checkpoint is currently manual maintenance.
7. After completion, inspect welcome/rules/choose-region, regional registrations/support/standings and global `commands`. Test buttons and run `/help`. Restart Railway and verify resource/message IDs persist. Live tests remain necessary before announcing completion.

## Text continuation

One heading is added to the logical message, before splitting. The complete formatted text is split below Discord's limit at paragraph, line, sentence or clause boundaries where possible; oversized sentences continue at whitespace. No words or URLs are cut, and concatenating the chunks reproduces the full text. A single unbreakable token longer than the limit produces a clear error rather than silent truncation. Files/embeds appear once, with buttons on the final continuation. Official panel continuation IDs are retained and updated without duplicating the first title. This is Markdown formatting; rich embeds from old dynamic posts are preserved.

The command guide documents current slash commands, examples, required roles and visibility. Guild registration remains the source of available commands. The ping command exists only when STARPOINT mode is disabled, so it is not listed as an active STARPOINT command.
