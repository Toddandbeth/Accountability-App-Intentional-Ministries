# Intentional Ministries Accountability App — Blueprint

This document consolidates everything worked out across the earlier Bubble.io planning sessions plus the decisions made in this conversation. It is meant to be handed to Claude Code as the starting spec. It reflects the final, authoritative versions of each decision — earlier drafts and abandoned ideas have been left out on purpose, per your own instruction from the original planning sessions.

## App Overview

A group-based weekly accountability tool. Small groups of men meet on a recurring day (default Monday). Before each meeting, every member privately rates himself on five life categories. On meeting day, the group leader opens a dashboard and sees everyone's ratings at a glance — no scrolling through individual answers, just a quick visual grid that shows who is strong and who needs a conversation that week.

Brand: Intentional Ministries (intentionalministries.com). Not connected to Full Count Ministries. Sits alongside your existing books and tools (Intentional Discipleship, Intentional Marriage, the 30-day challenge) as part of the same site and audience.

Platform: mobile-first Progressive Web App (PWA). Looks and feels like a downloaded phone app — home screen icon, full-screen, no browser bar — without the App Store approval process or a separate iOS/Android codebase. Works on desktop too through a normal browser.

## Users and Roles

Every person has an account (email and password, persistent login — they should not have to log in every visit).

A user can belong to more than one group. Each user has an "active group" — whichever group they're currently viewing inside the app.

Within a group, a person is either:
- Admin (group leader) — can edit questions, change meeting day, manage settings
- Member — submits check-ins, views the group

A group can have more than one admin.

## Group Creation and Joining

Only a group leader creates a group. When they do, the group gets a unique name or code.

The leader shares that code with the men he wants in the group. A person logs into the app, enters the code, and requests to join.

The leader must approve each join request before that person becomes an active member and can see or submit anything for the group. This is exactly what the Membership status field is for — a request comes in as pending, and the leader approving it moves that person to active. Denying or ignoring it just leaves them out.

## Weekly Cycle Rules

These are the rules governing how a "week" works — locked and finalized in the original planning:

Weekly structure
- Each group has a meeting day (default Monday, changeable by an admin to any day)
- A week starts on the group's meeting day and ends at the deadline

Deadline (revised — see note below)
- Deadline is 11:59 PM local group time, on the meeting day itself — not the day before
- No grace period
- The week stays editable — members can change their answers as many times as they want — until the deadline. Last saved value wins.
- After the deadline, the week locks permanently. No edits, no exceptions.

Why this changed from the original plan: the deadline originally was set to the night before the meeting day, so results would be ready in advance. In real use, this backfired — since a new week begins the moment the meeting day starts, the dashboard was wiping clean and showing a blank new week right as the meeting day began, before the leader ever got to use it. Moving the deadline to the end of the meeting day itself fixes this: the current week's real results stay live and visible on the dashboard through the entire meeting day, members can still check in that morning or even during the meeting if they forgot, and the dashboard only resets to a new blank week the day after. Group cultures can still informally encourage checking in the night before — the app itself no longer forces that timing.

Deliberately not adding a "linger" or grace period after the deadline passes, beyond the deadline shift above. Reasoning: nothing is actually lost once a week locks and the dashboard shows the new blank week — the data stays fully accessible through History (each member's personal history) and through the 6-week trend view available to any group member (see Round 2 and Round 5). Adding a separate lingering-but-locked state on the main dashboard would be a third state to design and explain, without solving a problem the existing history features don't already cover.

Changing the meeting day
- An admin can change the meeting day at any time in Group Settings
- The change never affects the current, already-in-progress week
- Rule: the new meeting day takes effect starting with the next week, after the current week has locked

Week identity and history
- Every week is identified by a week_start_date, stored permanently on each check-in
- Historical weeks are never recalculated or shifted, even if settings change later

Time zone
- Each group has one time zone (not per-user)
- All deadlines and week boundaries are evaluated using the group's time zone
- Timestamps are stored in UTC internally

New members
- A new member can submit a check-in for the current active week if the deadline hasn't passed yet
- No retroactive submissions once a week is locked

## Data Model (Authoritative)

This is the final structure. Everything else in the app (screens, permissions, dashboard logic) builds on top of this without changing it.

User
- first name, last name
- email, cell phone (optional)
- profile image
- active_group (which group they're currently viewing)
- platform_admin (true/false — marks the app-wide admin; not tied to any single group)

Note: group membership is not stored on the User record — Membership is the source of truth for that.

Group
- Group name
- Group code (for joining)
- Meeting day (Monday–Sunday)
- Time zone (IANA format, e.g. America/Chicago)
- Creator
- Active/inactive flag
- Slug (for a clean URL)
- group_update_link_url (text, optional — the leader-editable link inside Group Update)
- group_update_text (text, optional, length-capped — the leader-editable message inside Group Update)
- group_update_flag (true/false — set to true when the leader posts an update, cleared to false the first time anyone on the group opens the Group Update box)

Note: the resource_link_url/resource_link_label fields from earlier are superseded by group_update_link_url and group_update_text above — folded into the single Group Update block rather than living separately in Group Settings.

Membership (connects a User to a Group)
- user, group
- role: admin or member
- status: active, inactive, pending, removed
- joined date
- hidden_by_user (true/false, default false — a personal declutter preference, see Round 5)

Exactly one Membership per user per group. This table is the only source of truth for who belongs to a group and who its admins are.

GroupQuestion (the 5 questions for a specific group)
- group
- label_short (the question title)
- label_description (the helper text explaining what it's asking)
- slot_number (1–5, controls order)
- goal_enabled flag

Each group owns its own independent copy of 5 questions, seeded from defaults when the group is created (see below). Admins can edit their group's wording without affecting any other group.

WeeklyCheckIn (one record per person per group per week)
- user, group
- week_start_date
- rating_1 through rating_5 (one per question slot)
- prayer_request (text, optional)
- reaction_heart_count (integer, default 0)
- reaction_pray_count (integer, default 0)
- reaction_thumbsup_count (integer, default 0)
- reaction_praise_count (integer, default 0)
- updated_at

One record holds all five ratings together, plus that week's prayer request and its reaction counts. week_start_date never changes once written. Locked weeks are immutable — but see the reactions note below for how this interacts with locking.

Goal (one record per person per group per category, persistent — not tied to any week)
- user, group
- question_slot (1–5, matches the group's category order)
- goal_text
- updated_at

Deliberately separate from WeeklyCheckIn. A goal is something a member sets once and updates whenever he wants — it does not reset weekly, does not lock, and is not part of the weekly deadline rules at all. Editing a goal has no relationship to whether the current week is open or locked.

## How Default Questions Work

When a new group is created, the system automatically creates that group's 5 GroupQuestion records, pre-filled with the default wording below. From that point forward, the group's questions live independently — admins can edit them, and editing one group never touches another group's copy or the original defaults. An admin can also "reset to defaults" later, which overwrites their group's current questions with the original wording again.

The five default categories and their final wording:

God — My Daily Walk with God
My daily walk with God as shown through my prayer life, time in Scripture, involvement in church community, serving others, spiritual conversations, and a consistent heart of gratitude.

Family — Loving and Leading My Family
Loving and leading my family through intentional time together, healthy communication, resolving conflict with grace, serving and encouraging one another, protecting family priorities, and making God a clear priority in our home.

Work — Honoring God Through My Work
My approach to work as reflected in maintaining healthy balance, pursuing growth and excellence, leading with integrity and influence, building positive workplace relationships, making ethical decisions, finding satisfaction in my work, and living out my faith on the job.

Personal — Stewarding My Personal Life
How I steward my personal life as reflected in caring for my physical and emotional health, managing my time and priorities well, pursuing personal growth, nurturing relationships, handling finances responsibly, and practicing gratitude and contentment.

Purity — Purity and Moral Integrity
My commitment to purity as reflected in guarding my thoughts, resisting temptation, maintaining moral integrity, choosing positive influences, being discerning with media, seeking accountability, and establishing healthy boundaries.

## Rating Scale and Colors

Each question is answered with one tap on one of five buttons, in this order:

Strong (5) — dark green
Good (4) — light green
Okay (3) — yellow
Weak (2) — orange
Help (1) — red

The selected button gets a 3-point black border around it. Selecting a different button removes the border from the old one and adds it to the new one automatically — this is driven entirely by which value is currently saved, no extra logic needed to "turn off" the old selection.

## Screens

Based on the mockups already worked out:

Check-in screen (member view)
- Group name shown at the top
- Each of the 5 questions listed as its own card: title, then the row of 5 rating buttons underneath
- Takes roughly 20 seconds to complete — tap through all 5, done

Dashboard screen (visible to the whole group, not just the admin) — collapsed row, per member
- One row per group member, current week only
- Left side, fixed and compact: profile photo or initials icon, then first name only (not last name) — kept short and on a single line, never wrapping, so it doesn't crowd or resize the row
- A small dot or indicator next to the name if that member submitted a Prayer & Life Update this week
- The rest of the row, given as much space as possible: that member's 5 answers shown as colored, labeled buttons, in question order — the question text itself is not restated on this row, just the answers, since column headers above the grid (see below) already establish the order
- This row must stay visually clean and consistent at any name length — no wrapping, no squeezing the icons or rating buttons to make room for a name. First-name-only is deliberately chosen to keep this guaranteed.
- The entire group should be readable in one glance — this is the main design goal, and nothing above should compromise it

Column headers above the dashboard grid
- Small labels above each of the 5 columns (God, Family, Work, Personal, Purity) so members don't have to memorize question order
- Must have enough width to display each label in full — "Personal" must not truncate to "Pers…" the way it currently does. Adjust column spacing/sizing so all 5 labels fit cleanly, even if that means the columns are slightly wider than they are today.

Dashboard row, expanded (tap to open)
- Tapping a member's row expands it, pushing the rest of the dashboard down — same interaction pattern as the Group Update box
- Always shows, whether or not a Prayer & Life Update was submitted that week: the member's full first and last name, and their phone number if they've provided one, formatted so tapping the phone number offers to call or text it directly (a standard tap-to-call/text link, not custom-built calling functionality)
- This name-and-phone header can wrap to a second line if the name is long — unlike the collapsed dashboard row above, there's enough room here that wrapping is fine and expected
- Below that header, a visually distinct divider or band, separating the contact info from the content below it
- Below the divider: "Prayer & Life Update" as a bolded label, then the actual text the member submitted that week, or empty space if they didn't submit one
- Below the update text: the 4 reaction icons (heart, prayer hands, thumbs up, raised hands), each tappable, each showing its current count
- Below the reactions, two buttons, both available to any group member (not leader-restricted — see Round 5):
  - "6-Week History" — opens that member's ratings and Prayer & Life Updates for roughly the last 6 weeks. Reactions are not shown in this history view, only in the current week's live expanded row.
  - "See [Name]'s Goals" — opens a further drop-down showing all 5 categories with that member's current goal text under each (blank if he hasn't set one for that category). Separate from the history button above, since goals are persistent and not tied to any specific week.

Personal history screen (each member's own view, private to them)
- Scoped to whichever group is currently active — not combined across a user's multiple groups. Since every group is treated as fully separate (see Round 5's related note on multi-group separation), this keeps the personal history screen consistent with how everything else in the app already works.
- A scrollable list of past weeks, most recent first
- Each week shows that week's date and the same 5 colored, labeled buttons the member chose that week
- Purpose: let a member spot his own patterns over time — for example, noticing the same category has been weak for six weeks running, even if the other four have been consistently strong

Prayer & Life Update
- Part of the weekly check-in — each week, a member can optionally add a short update alongside his 5 ratings
- Visible to the rest of the group only through the expanded dashboard row described above, not shown inline in the main grid
- Reactions: 4 tap-to-react icons available on any Prayer & Life Update — heart, prayer hands, thumbs up, and raised hands (celebration/praise). Each is a simple counter that increments by 1 on tap. Deliberately not attributed to who reacted — no record of which member tapped which icon, no limit preventing someone from tapping more than once, no "who reacted" list ever shown. This keeps it genuinely simple (a few counters per check-in, nothing more) rather than building a full reactions system. Note on locking: since reactions are a way for the group to respond after seeing an update, reaction counts should stay editable even after a week's ratings and prayer request lock at the deadline — only the ratings and prayer_request text itself are frozen at lock time, not the reaction counts.
- A group chat deep-link (opening the group's existing iMessage or similar thread directly from the app) was discussed and held out of this round — not being built now.

Settings screen
- User Profile
- Your Groups — list of groups the user belongs to, with the ability to switch active group, join a new one by code, or start a new one (see Round 3 below)
- Group Settings (per group, since a user can be in more than one) — includes Members (status and approval management) and the group's Group Update fields, editable by the admin
- Bottom navigation: Home, Dashboard, Settings (Group tab removed — see Round 3 below)

## Feature Scope for Version 1

Confirmed for v1:
- Email and password login with persistent session
- Private groups only, joined by group code, with the group leader approving each join request before access is granted
- One check-in per user per group per week, five questions rated 1–5, editable until deadline
- Group dashboard showing current week for all members, with tap-through to see an individual's prayer request
- Trends: a rolling view of recent weeks (default last 5, up to 10), built only from stored historical data, never recalculated
- Personal history: a user's own past check-ins, read-only, showing all 5 answers per week going back through recent weeks
- Prayer requests: an optional text field submitted alongside each week's check-in, visible to the group by tapping that member's name

Explicitly left out of v1 (not decided against forever, just not in the first build):
- Push notifications or reminders
- Personal goal-setting tied to categories
- Payments/subscriptions (see below — current direction is a free app)

## Monetization Direction

Current decision: launch free, monetize through your existing Intentional Ministries products (books, the 30-day challenge, other tools) rather than charging for the app itself.

At free-tier hosting (see below), infrastructure cost is close to $0/month for a long time — likely into the thousands of users before any real cost shows up. This makes "free app, income from products" a workable model without the app needing to carry its own revenue.

Practical implication for the data model: worth capturing an email at signup (already part of the User record above) so you have a way to occasionally point active users toward your books and tools.

The resources tab is a single external link per group, set and updated by the group's admin — not fixed content stored inside the app. This could point to a book, the 30-day challenge, a video, or anything else the leader wants to recommend that week or month, and it can change any time without a rebuild since it's just a URL and a label stored on the Group record.

If you decide later to add a paid tier, the earlier planning sessions worked out the standard approach (Stripe subscription, a flag on the User record like is_current_member, webhooks that update that flag when payment succeeds or fails). That can be layered on top of this structure later without a redesign — it does not need to be built now.

## Hosting Plan

- Hosting: Vercel (free tier covers this comfortably at real scale)
- Database and login: Supabase (free tier covers roughly 500MB storage and 50,000 monthly active users — far beyond what this app needs early on)
- Domain: a custom subdomain off intentionalministries.com, or a free Vercel subdomain to start
- Code lives in your own GitHub account, not locked inside any single vendor — if you ever need to switch hosts, the code and database both move with you

## Decisions Log

These were the open questions from earlier drafts, now settled:

- Group creation: only a leader creates a group. Members join by entering the group's code, then wait for the leader to approve their join request before they have access.
- Previous weeks: handled on each member's personal history screen, not the main dashboard — a scrollable list of past weeks with that week's 5 answers shown for each.
- Prayer requests: submitted weekly alongside the check-in, viewed by tapping a member's name on the dashboard rather than shown in the main grid.
- Resources link: one external URL per group, set and changed by the admin at any time — not fixed content built into the app.

## Build Status

Completed and sent to Claude Code:
- Initial build — core app: auth, groups, check-in, dashboard, join-by-code, personal history, settings
- Round 2 — bug fixes and small features from first real testing
- Round 3 — bottom nav fix, platform admin role, Group Update, dashboard redesign, reactions, 3-tab consolidation
- Round 4 (urgent) — deadline timing fix, correcting logic that's already live and causing a real problem
- Round 5 — history access and data retention: opening 6-week history to all members, protecting removed members' access to their own data, deactivated-group roster, hiding old groups from your list

Pending, not yet sent — in the order they should be sent:
- Round 6 — welcome email, persistent goals feature, and where in-app instructions live

## Round 2: Fixes and Additions from Real Testing

The core app (auth, groups, check-in, dashboard, join-by-code, history, settings) is built and working. This section covers what came out of actually using it with test accounts. Treat the bugs as bugs — something already built is not working correctly — not as new features to design from scratch.

### Bugs to fix

- Sign-in link did not work on mobile browser — a new user could not log in from their phone at all. This needs to be reproduced and fixed as a priority, since phone use is the primary way this app will be used.
- A member joined by group code, was approved by the admin, and the admin can see them as a member — but the member himself cannot see the group name or dashboard. Something in what a newly-approved member can see is broken.
- A prayer request submitted by a member did not reach the admin's view the first time, but showed correctly on the member's own screen. Submitting a second time worked. This points to a save or sync bug, not a display bug — add a visible Submit button for the prayer request field so saves are explicit and confirmed, rather than relying on an implicit save (like losing focus or pressing enter) that may be firing inconsistently.
- Member status (pending, active, removed) exists in the data model but is not visible anywhere in the app yet, for admins or members. This needs to be exposed in the UI — an admin should be able to see who is pending approval and who is active or removed, from Group Settings.

### Rules to confirm are correctly enforced

- If a member does not submit a check-in for the current week, the dashboard must show them as blank or not-yet-submitted — never carrying over the previous week's colors or prayer request as a stand-in. Every week is its own record; nothing should visually persist across weeks unless it was actually submitted that week.
- Prayer requests reset each week along with the ratings, as part of the same weekly check-in record — not a separate ongoing list.

### New features for this round

- Prayer request field gets a character limit (a reasonable cap — something like 250–500 characters is enough for a short update, not an essay) and a visible Submit button.
- Rename "Prayer Request" to "Prayer & Life Update" — it should also welcome a short praise, win, or general update about one of the 5 categories, not just requests.
- Each of the 5 categories has its title always visible, with a short description underneath that can be toggled show/hide per user preference. Default: description shown.
- Dashboard gets a small icon or dot next to any member who submitted a Prayer & Life Update that week, so the group can see who has one without tapping into every member individually.
- Profile photo upload, shown on the dashboard in place of initials. Resize and compress to roughly 200x200 pixels before saving, regardless of original upload size, to keep storage costs negligible at scale. Optional — default to first and last initial if no photo is uploaded.
- Member history view: from the dashboard, any group member can tap another member's name and see that member's own check-ins (ratings and Prayer & Life Updates) for roughly the last 6 weeks. Originally scoped as leader-only — see Round 5 below, which opens this to every group member. Do not build a separate whole-group historical dashboard snapshot feature for v1 — this one member-level view covers the real need.
- Member removal: leader can remove a member from a group, which sets their Membership status to removed and immediately cuts off their access. Do not auto-regenerate the group code when someone is removed — that would also lock out every other current member for no reason. If a removed person re-enters the group code later, it should simply create a new pending join request like any other join attempt, which the leader can ignore or deny — no separate "block" feature needed.
- A short onboarding explainer at the signup/join step — a screen or slide-through that briefly explains what to expect (the weekly rhythm, when things reset, what the group code is for, what happens once approved). Sequence this after the current bug-fix round, not before.

### Usability fix bundled into this round (not a styling pass)

- Column headers above the dashboard grid — see the full spec in the Screens section above (all 5 labels must display in full, including "Personal," with column sizing adjusted as needed).

### Held for a later, dedicated styling round

- Bottom navigation icons instead of text labels
- Overall color palette and visual polish once brand colors and an app icon are finalized

## Round 3: Bottom Nav Fix, Platform Admin, and Group Update

### Bottom navigation — priority fix, non-negotiable

The current bottom nav uses text labels only, and they sit low enough on the screen to interfere with the phone's own system gesture area (making some buttons hard or impossible to tap reliably). This is a functional bug, not a style preference, and takes priority over the "held for later" styling items listed in Round 2. Fix: icon over label for each of the 4 items (Home, Dashboard, Group, Settings), with proper spacing that respects the phone's safe-area so it doesn't conflict with system gestures.

### Platform admin — a new role, separate from group leader and member

Everything built so far has two roles, both scoped to a single group: leader and member. This adds a third role that sits above all groups — the ministry-wide admin (the pastor running Intentional Ministries, i.e. the person building this app). Marked with the platform_admin flag on the User record, not tied to membership in any particular group.

No separate login or account is needed. The admin signs in exactly like everyone else, with their normal email and password — the app simply recognizes their account has platform_admin set to true and reveals an extra section that no other user sees at all, likely as its own tab or a section inside Settings that only renders when this flag is present.

What the platform admin can do:
- View general, non-identifying statistics inside a collapsible "System-Wide Stats" box: number of active groups, total participants, and recent check-in activity rate. Confirmed rule: absolutely no visibility into individual answers, ratings, or Prayer & Life Update content at the platform admin level — the boundary is aggregate counts only, never individual content, no exceptions.
- Set and update one permanent ministry-wide resource link, visible to every user across every group, pointing to a page the admin fully controls outside the app (their own website). The app only stores and displays this one URL — it does not manage or render any content behind that link. Changing what's behind the link happens entirely outside the app, so the admin never needs to touch the app itself to update what people see when they click it.

### Group Update — replaces the earlier standalone "resource link" idea

Sits as a collapsible bar at the top of the group dashboard, using the same expand/collapse interaction already built for prayer requests. Tapping it pushes the dashboard down and reveals:

1. The platform admin's permanent ministry-wide link (always present, not editable by the group leader)
2. A group-specific link, editable by that group's leader at any time (this replaces the earlier separate "Group Resource" field from Group Settings — one place to manage it now, not two)
3. A short text update, editable by the leader, with a length cap (roughly 250–500 characters, matching the cap already set for Prayer & Life Updates)

Indicator behavior: when the leader edits and posts to the Group Update box, they manually trigger a flag (something like a "Post Update" button) that lights up an indicator on the collapsed bar. The flag is a single shared true/false value for the whole group, not tracked per individual member — it clears automatically the first time anyone in the group opens the Group Update box. This deliberately avoids building per-member "seen/unseen" tracking, which would require a record per member per update and checking it on every dashboard load — the simpler shared flag gets most of the value (an obvious "something's new" signal) for a fraction of the complexity.

### Password rules and account recovery

No strict password complexity rules needed — a reasonable minimum length (roughly 6–8 characters) is enough for this app's security needs. What matters more is that a forgotten-password flow actually exists: a "Forgot password?" link on the sign-in screen that emails the user a reset link. This is standard functionality Supabase Auth already supports — it needs to be wired into the sign-in screen, not built from scratch.

### Member status visibility — fixed in this round

The bug flagged in Round 2 (member status — pending, active, removed — not visible anywhere in the app) is fixed here. Shape: this lives as its own "Members" section inside Group Settings, showing every group member's current status, with the ability for the leader to approve a pending request or remove an active member directly from that same list — not scattered across different screens.

### Multi-group switching — design and where it lives

Multi-group support (a user belonging to more than one group) was included in the original build summary, but the actual switching flow hasn't been seen or confirmed working yet. Confirmed design, to build or verify against:

- Lives inside Settings, under "Your Groups" — a list of every group the user belongs to
- Tapping a group in that list sets it as the user's active_group; the dashboard, check-in, and everything else immediately reflects that group
- Two actions alongside the list: "Join a group" (enter a code, same flow as a first-time join) and "Start a new group" (become leader of a brand new one)
- Known limitation, accepted for v1: there is no single combined view across a person's multiple groups. A leader of more than one group must switch into each one individually to check on it — approve pending members, see that group's own Group Update, etc. No cross-group notification badge exists yet. This is a reasonable v1 tradeoff since most users are in exactly one group; worth revisiting later only as a small badge on the group switcher itself, not full cross-group notifications, if it becomes a real pain point.

### Bottom navigation — consolidate to 3 tabs

The Group tab, once the Group Update content moves to the dashboard (Round 3 above) and the resource link is folded in, has little distinct content left for a regular member — mostly duplicating what's already visible on the dashboard. Decision: remove the Group tab entirely and consolidate to 3 tabs — Home, Dashboard, Settings.

What moves where:
- The member list, and leader-only member status/approval management (from the "Member status visibility" fix above), lives inside Settings → Group Settings
- Everything else previously under the Group tab folds into either the Dashboard (Group Update) or Settings (group management)

This also leaves room for a genuine 4th tab later, if a real need for one emerges, without first having to remove a Group tab that wasn't earning its place. This decision applies on top of the bottom nav icon fix listed earlier in this round — build the 3-tab version with icons from the start, not the icon fix on the old 4-tab layout.



## Round 4: Deadline Timing Fix (Urgent — Changes Already-Built Logic)

This is a fix to the core deadline rule in Weekly Cycle Rules above, found through real Monday-meeting use. Flagging separately and clearly because this changes logic that's already built and running, not a new addition.

The problem observed: with the deadline set to the night before the meeting day, the dashboard reset to a blank new week right as the meeting day began — before the leader could use the group's actual results during the meeting itself, since the meeting is held on that same day.

The fix: change the deadline calculation from "11:59 PM the day before the meeting day" to "11:59 PM on the meeting day itself." This is a change to the underlying week/deadline calculation logic (the same logic referenced in the original migration and week-lock functions), not just a display change — it needs to be updated wherever the deadline is calculated or enforced, including any database functions handling the lock.

No changes needed to history, personal history, or the leader's 6-week trend view — those already work correctly and don't need touching as part of this fix.

## Round 5: History Access and Data Retention

Four related decisions, all about who can see historical data and how long access lasts — grouped together since they touch the same part of the app.

### Open 6-week history to all group members

Originally, the 6-week history view (ratings and Prayer & Life Updates for a specific member, going back roughly 6 weeks) was scoped as leader-only, to avoid it feeling like surveillance if every member could browse every other member's past weeks.

Revisited after real use: a group member (not the leader) wanted to look back at what another member shared in a prior meeting, to follow up and pray for him specifically, and had no way to do so once that week rolled into history. Given the group's current week is already fully shared and visible to every member in real time — there is no privacy between members on their current answers — restricting that same information's recent past to leader-only was an inconsistent, unnecessary restriction rather than a meaningful privacy boundary.

The fix: any group member can tap any other member's name and access their 6-week history, exactly as the leader currently can. No change to the 6-week window itself — the reasoning for that length (enough to spot a real pattern, not just react to one off week) applies just as much to a peer as to a leader.

One thing this does change, and needs fixing: reactions were previously described as staying editable even after a week locks, but the current design gives no place to actually do that — once a week locks, it immediately leaves the dashboard and is only reachable through this history view, and the history view was built without reactions on it. That gap only appeared once Round 4 made the lock and the dashboard rollover happen at the same instant, closing the window the original "stays editable after lock" rule assumed would exist.

The fix: add the same 4 reaction icons and counts to each week shown in the 6-week history view, not just the current week's live row. This directly serves the original reason reactions were built — someone wanting to react to a request the morning after a meeting, once that week has already locked and rolled into history.

### Personal data retention — removed members and inactive groups

Raised as a "what if" before it became a real problem: if someone is a member of a group for years, then is later removed (or a leader effectively replaces the group with a new one and removes everyone), does that person lose access to their own years of history?

The underlying data was never at risk — every WeeklyCheckIn record is permanent regardless of what happens to Membership status later. The real risk is a permissions gap: access control tied only to current active membership could accidentally block someone from their own historical data, even though that data still physically exists.

Two explicit rules to prevent this:

- A user can always view their own historical check-ins (ratings, Prayer & Life Updates, reactions received) for a group, regardless of their current Membership status in that group — active, removed, or otherwise. This is treated as the individual's own personal data, not something access to is controlled by ongoing group membership. This does not extend to seeing other members' data or the group's current dashboard — only their own past submissions.
- Groups are never hard-deleted, only ever marked inactive via the existing Active/inactive flag. If a leader wants to "end" a group, that's a deactivation, not a deletion — this guarantees every member's historical records stay permanently reachable and never become orphaned by a missing group record.

### Deactivated groups become shared memory, not a dead end

A group that's deliberately deactivated (as opposed to one just left open and going stale with no activity) is different from a group someone was individually removed from. Removal is about protecting a currently-active group's privacy from someone no longer part of it — that stays exactly as defined above (own history only, no roster, no dashboard). Deactivation means the group itself is over, equally, for everyone who was ever part of it.

Rule: once a group is deactivated, anyone who was ever a member of it — currently active, previously removed, doesn't matter — can view a simple roster: the names and photos of everyone who was part of that group. This does not include anyone's private weekly content (ratings, Prayer & Life Updates, goals) beyond the viewer's own — the roster is "who was here," not "what everyone said." Each person's own historical data remains visible to them per the retention rules above, same as always.

This is meaningfully different from just leaving a group open and inactive without deactivating it — a group that's simply gone stale (no deliberate deactivation) does not unlock the roster view; normal active-group access rules still apply. Worth encouraging leaders to actually deactivate a group once it's genuinely done, specifically to unlock this shared-memory view for everyone who was part of it.

### Hiding old groups from your own group list

Over years, especially for someone leading a new group every year, a person's "Your Groups" list in Settings could grow long with groups that are done and not worth seeing regularly. This is purely a personal display preference, unrelated to access or deactivation status.

Rule: each Membership record has a personal hidden_by_user flag. A user can hide any group from their own "Your Groups" list at any time, and unhide it later if they want it back. This only affects what that one user sees on their own screen — it doesn't affect the group itself, other members, or anyone's access to anything. A hidden group's data (including that user's own history, and the roster if the group is also deactivated) is unaffected and still reachable if the user chooses to unhide it.

UI specifics:
- The main "Your Groups" list shows only visible (not hidden) groups by default
- Below that list, a link showing a count, e.g. "Hidden Groups (8)" — the count makes it clear at a glance how many are tucked away without needing to open the list
- Tapping that link opens the hidden groups list, where each group has a way to unhide it, moving it back into the main visible list immediately
- Symmetric in both directions: any group in the main list has a way to hide it; any group in the hidden list has a way to unhide it

## Round 6: Welcome Email, Goals, and Instructions Placement

### Welcome email

Fires once, automatically, after a person's first successful signup — same content for a leader and a participant (a participant benefits from knowing what's available to leaders, for future reference, in case he leads a group himself later). Short and scannable, not a full manual. Covers the basics of how the weekly rhythm works, then closes by introducing Intentional Ministries and linking to the platform admin's ministry-wide link (the same field described under Platform Admin above) — so if that link's destination ever changes, the email automatically stays current without needing its own separate update.

### Goals — persistent, not weekly

See the Goal entity in the Data Model section above. A member can optionally set a goal for each of his group's 5 categories (e.g. "consistent quiet times," "memorize 10 scriptures"). Unlike ratings and Prayer & Life Updates, a goal is not tied to any single week — it stays exactly as set until the member changes it himself, with no reset, no lock, no deadline.

Displayed on the group dashboard as a second, separate drop-down beneath the Prayer & Life Update drop-down (see the expanded dashboard row spec above) — a member can browse the group's current answers without ever seeing goals unless he specifically taps in to look.

### Where "how this works" content lives — avoid duplicating instructions in three places

- Settings tab inside the app is the source of truth. This is where the actual explanation of how each feature works belongs (goals, prayer requests, the group code, etc.) — it's always current since it sits next to the features it explains, and doesn't require separately maintaining the same explanation elsewhere.
- The welcome email is a short first-touch intro, not the full manual — enough to get someone oriented, pointing back to Settings for anything deeper.
- A separate, unlisted Squarespace resource page (discussed outside this app's build, not part of this technical spec) serves a different purpose — a broader ministry hub with tools, self-evaluations, and book recommendations, not a duplicate of in-app instructions. It may include a brief one- or two-line pointer back to the in-app Settings tab for app-specific how-to content, rather than re-explaining app features itself.

## Handoff Note for Claude Code

This document is the spec. The database design (Data Model section) should be treated as fixed — build the screens, workflows, and permissions on top of it rather than changing its shape. Round 4 is urgent and should be sent and completed first. Round 5 and Round 6 can follow in either order, but Round 5 is the smaller, more self-contained of the two.
