# Specification

## Summary
**Goal:** Make profiles privacy-safe and more informative, improve @mention interactions, and restore correct server owner management controls.

**Planned changes:**
- Remove Principal ID display for other users across all UI surfaces (profiles, popovers, authors, lists, search/autocomplete, DMs, servers/channels, etc.).
- Add a signed-in-user-only control in Profile & Settings to reveal/hide their own Principal ID (hidden by default) with a copy-to-clipboard action and success confirmation.
- Extend backend profile data to include bio and join date, plus per-field public/private visibility settings for all profile fields; return only public fields to non-owners.
- Update Profile & Settings UI to edit bio and manage per-field visibility toggles for all supported fields, with all user-facing text in English.
- Update public profile surfaces (including profile popovers) to show meaningful public profile fields (display name, avatar, bio/join date when public) and never show Principal IDs.
- Fix server management action visibility by basing ownership/permission checks on the server owner Principal returned by the backend.
- Enhance rendered @mentions to be visually distinct and clickable to open a profile surface, resolving to the correct user identity without exposing Principal IDs.
- Add any necessary backend state migration to preserve existing profiles and initialize new fields/visibility settings with safe defaults (including join date handling for existing users).

**User-visible outcome:** Users no longer see anyone else’s Principal ID anywhere; they can optionally reveal and copy their own ID from settings, customize what profile fields are public (including bio and join date), see richer public profiles, click @mentions to open profiles, and server owners regain access to server management actions.
