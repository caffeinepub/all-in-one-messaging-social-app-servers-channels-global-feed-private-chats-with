# Specification

## Summary
**Goal:** Add richer server/channel customization, role-based permissions with presets, expanded user profiles with privacy controls, global username autocomplete, quick profile popovers, and a reliable avatar upload flow.

**Planned changes:**
- Add server settings and channel settings UIs to edit additional fields (e.g., description/topic, icon, banner, and supported settings) and persist them in the backend.
- Implement server roles with preset ranks (Owner, Admin, Moderator, Member), assign roles to members, and enforce permissions for server/channel edit/delete/customization actions.
- Add a path for server owners to customize permission flags for the preset roles and persist those changes.
- Expand user profiles with additional editable fields (social/gamer-style fields such as bio, links, banner, status, badges, pronouns, theme color or similar) and render them in at least one read-only context.
- Add a Profile/Settings toggle controlling whether the user’s principal/ID is visible to other users, and apply it anywhere identity details are shown.
- Implement global username/display-name autocomplete for user selection contexts (at minimum: starting DMs and @-mention style selection where supported), backed by a backend user search query.
- Add a quick profile preview popover/modal when clicking a user’s avatar/name in messages (channels and DMs), showing key profile info and respecting ID visibility.
- Fix end-to-end profile avatar image upload so uploads validate, show success/failure feedback, persist across refresh, and render correctly (without breaking URL-based avatars if present).

**User-visible outcome:** Users with permission can customize servers and channels with richer fields, servers enforce role-based permissions (with preset roles and owner-editable permission flags), profiles support more fields and an ID visibility toggle, usernames can be searched via autocomplete in key places, clicking a message author shows a quick profile preview, and avatar uploads work reliably.
