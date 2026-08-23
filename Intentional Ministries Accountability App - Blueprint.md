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

Changing the meeting day (revised — see Round 8, supersedes Round 7's short-week version)
- An admin can change the meeting day at any time in Group Settings, to any day, with no restrictions on which days are selectable
- The change takes effect immediately on the currently open week, not deferred to a future week
- Rule: the new lock date is always at least a full 7 days from the day the current week originally started — never shorter, occasionally a little longer depending on which day is chosen. Concretely: take the current week's original start date, add 7 days to get a floor, then find the next occurrence of the newly chosen meeting day on or after that floor.
- Short weeks are explicitly not allowed under any circumstance. Reasoning, confirmed through real use: a short notice period (a meeting suddenly 2–3 days away) makes it more likely the group simply won't gather in time, even if the leader announced the change — guys waiting a full week for the new schedule to take effect is a better outcome than a rushed, easily-missed short week.
- In-app messaging should show the leader the actual resulting date the current week will now lock on, so there's no ambiguity about the effect of the change
- Because this still shifts a currently open week's deadline for the whole group, the Settings screen should include a clear note reminding leaders this is meant for permanent schedule changes, not for skipping or moving a single week's meeting (see wording in Round 7, still accurate)

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
- initials_circle_color (optional — a user-chosen color for their initials circle when no profile photo is uploaded, see Round 10)
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
- group_update_link_label (text, optional — the leader-editable clickable label for that link, e.g. "Check out this video on 2 Peter" — see Round 16. This is what actually displays and is underlined; the raw URL itself is never shown to the group.)
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
- short_label (one word — e.g. "God," "Family" — used for dashboard column headers and category labels in the goals view, see Round 13)
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

Dashboard screen (visible to the whole group, not just the admin) — collapsed row, per member (revised — see Round 10)
- One row per group member, current week only
- Left side, fixed and compact: profile photo, or a colored initials circle if no photo is uploaded (see Profile customization below). No name text on this row at all, first or last — removed deliberately in Round 10 to give the 5 rating boxes more room as font sizes increase. Identification happens via the photo/initials circle, plus the member's full name is shown immediately upon tapping into the expanded row.
- A small dot or indicator next to the icon if that member submitted a Prayer & Life Update this week
- The rest of the row, given as much space as possible: that member's 5 answers shown as colored, labeled buttons, in question order — the question text itself is not restated on this row, just the answers, since column headers above the grid (see below) already establish the order
- This row must stay visually clean and consistent — no wrapping, nothing squeezing the rating buttons
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
- Round 4 — deadline timing fix
- Round 5 — history access and data retention
- Round 6 — goals feature and in-app instructions reference (welcome email itself on hold pending an email provider)
- Round 7 — reactions-in-history fix, meeting-day-change crash fix, and the (now superseded by Round 8) short-week transition formula
- Round 8 — no-short-weeks meeting day change formula
- App deployed live via GitHub + Vercel; performance fixes (loading states, parallelized data fetching) identified and implemented after initial live testing revealed sluggish navigation
- Round 9 — Settings reorganization and goals relocated to check-in screen; deployed live
- Round 10 — typography scale, brand colors, visual polish, dashboard row redesign, active-group logic, group renaming, Round 9 group-list bug fix
- Round 11 — sent to Claude Code (unresponsive nav icons, icon sizing, font scale verification, active/inactive contrast fix)
- Round 12 — onboarding content fixes, pending-approval waiting screen, login screen redesign, goals button restyle, Help & Tips navigation shell (structure had gaps — see Round 13), and three bug fixes (password reset regression, plus-addressed email confirmation, PWA home screen icon); deployed live
- Font sizing — final exact pixel values (24/20/17/12px) applied app-wide and deployed live, including confirming the 12px utility tier fits real content
- Round 13 — rating button size fix, auto-shrink question titles, Help & Tips structural fix, editable category labels; deployed live
- Round 14 — question editor label rename, confirmation email redirect fix, theme consistency on the check-email screen, auto-shrink max-size cap, Weekly Questions repositioning/color fix; Resend email provider set up and connected (app@mail.intentionalministries.com — Resend required a subdomain, not the root domain), fixing confirmation/reset email branding and unlocking the welcome email feature; deployed live
- Round 15 — meeting date display, personal history moved to dashboard (layout since superseded by Round 16), email moved out of Settings header, nav icon states, nav bug diagnostic, sign-up screen theme fix, welcome email button label fix (turned out to already be correct — see Round 16 note), full Help & Tips content; deployed live
- Round 16 — check-in header restructured to a stacked vertical layout (supersedes Round 15's row layout); "Home" tab renamed to "Check-in"; page titles on all three tabs bumped to text-3xl/extrabold for real visual weight; two new tab icons (a document-with-checkmark for Check-in, a redesigned fuller-sweep gauge for Dashboard with a thicker needle and tick marks) built from provided style references and recolored to brand navy/periwinkle — outline when inactive, filled when active, same pattern as Settings; Manage Your Goals button changed from periwinkle to navy and now scrolls its content into view on open (verified: scrollY jumped from 0 to 1628px on click); Group Update's leader-content now sits in its own visually distinct box beneath the ministry-wide button, and a new group_update_link_label field (migration 0016) means only a short label displays and is clickable — never the raw URL, and only when both a label and a URL are set. Deployed live; needs migration 0016 applied.

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
- Overall color palette and visual polish — brand assets are finalized and ready (see below), this round is just not scheduled yet

Brand assets — finalized, ready whenever this round is scheduled:
- Primary color: #253551 (main navy blue) — use for headers, primary buttons, the app icon background
- Accent color: #7993c2 (periwinkle blue) — use for highlights and accents, distinct enough from the primary to stand out without clashing
- Secondary/neutral color: #ccd0d6 (light grey-blue) — use for backgrounds, dividers, and secondary or inactive states
- App icon: a rounded-square navy background with a white serif "I" mark (files: IM_-_App_Icon_-_blue_with_white.png and IM_-_App_Icon_-_white_with_blue.png) — use for the PWA home screen icon and browser tab icon
- Login/first screen: use IM_-_Main.png specifically — the vertical logo with the square "I" mark, "INTENTIONAL" in blue, "MINISTRIES" in grey beneath. This is a correction — an earlier instruction specified the horizontal version for this spot, which was not what was actually wanted.
- IM_-_Horizontal_-_blue_with_grey.png — the horizontal lockup, available for other places needing the full wordmark where a wide format fits better than the vertical Main logo (exact placement not yet specified beyond login)
- IM_-_logo_-_blue.png — the square (non-rounded) mark alone, available as needed
- Actual image files were sent directly in chat and needed to be manually added to the project folder before Claude Code could use them — this was missed during Round 10 and corrected afterward (see Round 11 follow-up)

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

Displayed on the group dashboard as a second, separate drop-down beneath the Prayer & Life Update drop-down (see the expanded dashboard row spec above) — a member can browse the group's current answers without ever seeing goals unless he specifically taps in to look. This is for viewing another member's goals and is unchanged — see Round 9 for where a member edits their own goals.

### Where "how this works" content lives — avoid duplicating instructions in three places

- Settings tab inside the app is the source of truth. This is where the actual explanation of how each feature works belongs (goals, prayer requests, the group code, etc.) — it's always current since it sits next to the features it explains, and doesn't require separately maintaining the same explanation elsewhere.
- The welcome email is a short first-touch intro, not the full manual — enough to get someone oriented, pointing back to Settings for anything deeper.
- A separate, unlisted Squarespace resource page (discussed outside this app's build, not part of this technical spec) serves a different purpose — a broader ministry hub with tools, self-evaluations, and book recommendations, not a duplicate of in-app instructions. It may include a brief one- or two-line pointer back to the in-app Settings tab for app-specific how-to content, rather than re-explaining app features itself.

## Round 7: Bugs Found in Live Testing

Three real bugs found while testing Rounds 4–6 in actual use.

### Reactions showing on weeks with no Prayer & Life Update

In the 6-week history view, reaction icons and counts are currently showing even on weeks where the member didn't submit a Prayer & Life Update — meaning four buttons all sitting at zero, with nothing to react to. Fix: only show the reaction icons for a given week in history if that week actually has update text. If there's no update, don't show reactions at all for that week.

### Changing meeting day causes a full logout/crash

Changing a group's meeting day in Group Settings currently forces the user completely out of the app, requiring a fresh login. On the next login, a message correctly explains when the change will take effect — but the forced logout itself should never happen. This is a straightforward crash to fix, unrelated to whether the deferred-change behavior below is correct.

### Meeting day change logic — revised, not just a bug fix

SUPERSEDED — see Round 8 below. This section's short-week behavior was built and tested, but real use of it prompted a further change: short weeks are no longer wanted at all. Kept here for history rather than deleted, but Round 8's rule is the current, correct one.

This supersedes what was originally written above and earlier in this section. Real use showed the original rule (a meeting day change only takes effect after the current week locks, always deferred to the following week) was more restrictive than actually wanted — it meant even a Tuesday-decided "let's meet Thursday this week instead" change couldn't take effect until an entire extra stale week had passed.

The revised rule, worked through with real examples: the deadline for the currently open week is always recalculated live, as the next occurrence of the (possibly just-changed) meeting day that comes strictly after today. Never today itself, which is what prevents the broken same-day or next-day lock bug entirely. Two concrete examples that define the intended behavior:

- Current meeting day is Monday, current week is in progress. It's now Tuesday. Leader changes the meeting day to Tuesday. Since today is already Tuesday, the system looks past today and finds next Tuesday — a full week out. The current week stretches to accommodate this (an 8-day week in this case), rather than locking today or creating a broken short week.
- Current meeting day is Monday, current week is in progress. It's now Tuesday. Leader changes the meeting day to Thursday. Thursday is only 2 days away, so the current week now ends there instead — a real, intentionally short 3-day week (Tuesday through Thursday), reflecting that the whole group already knows about the change.

No day of the week is ever restricted or unselectable, in any scenario — every day remains a valid choice at all times, including one that matches today's date.

This also resolves the original crash-adjacent 1-day-week bug from the earlier version of this fix — there's no more "snapshot the old schedule and defer" logic to get wrong, since the deadline is simply always recalculated live off the current settings.

Messaging: whenever a leader changes the meeting day, show the actual resulting date the current week will now lock on (e.g. "Your current week will now lock on Thursday, August 21"), so the effect is always clear and never something the leader has to calculate themselves.

### Add a settings reminder about permanent vs. one-time changes

Because this rule can genuinely reshape the currently open week for the whole group, add a short, clear note near the meeting day setting in Group Settings — something like: "Changing this updates your group's regular schedule going forward, and may shorten or lengthen the week currently in progress. Only use this for a lasting change to your meeting day — not to move or skip a single week's meeting."

## Round 8: No Short Weeks — Revised Meeting Day Change Formula

This changes what Round 7 actually shipped and you tested live. Worth being direct about that: this isn't a refinement, it's a reversal, based on what real use showed — a short notice period (a meeting suddenly 2–3 days away) makes it more likely the group simply won't gather in time, even with the leader announcing the change. Confirmed conclusion: it's better for guys to wait a full week for a schedule change to take effect than to risk a rushed, easily-missed short week.

### The new rule — no short weeks, ever

Whenever a leader changes the meeting day, the new lock date must always be at least 7 full days from the day the current week originally started — never shorter. Formula: take the current week's original start date, add 7 days to get a floor, then find the next occurrence of the newly chosen meeting day on or after that floor.

Worked examples, confirmed against real testing:

- Week started Monday. Leader changes meeting day to Tuesday. Floor is 7 days after Monday (next Monday). Next Tuesday on or after that floor is 8 days from the original start. Current week runs 8 days instead of locking early.
- Week started Monday. Leader changes meeting day to Saturday. Floor is 7 days after Monday (next Monday). Next Saturday on or after that floor is 12 days from the original start.
- Week started Monday. Leader changes meeting day to Monday itself (no actual day-of-week change, or re-confirming the same day). Floor is 7 days after Monday. That is itself the next Monday — exactly 7 days, the shortest a week is ever allowed to be.

No day of the week is ever restricted or unselectable — every day remains a valid choice regardless of today's date. The restriction is entirely on the resulting lock date, never on which day a leader is allowed to pick.

### On requiring changes to only happen after the current week closes

Explicitly not building this as an additional restriction. The 7-day-minimum formula above already guarantees no short week regardless of when during the current week a leader makes the change — requiring changes to only happen after close would add friction without preventing anything the formula doesn't already handle.

## Round 9: Settings Page Reorganization

Pure UI/navigation reorganization — no data model or schema changes. The current Settings page has grown cluttered as features accumulated across earlier rounds; this reorders and restructures it for clarity, using three distinct interaction patterns depending on what each section actually is.

### Interaction patterns to use

- Inline, always visible — for content simple or important enough that it should never be hidden
- Collapsible reveal — for short, static content (like an explanation), expands in place without leaving the page
- Slide-over panel (iOS-style: tap a row, slide to a dedicated screen, back arrow to return) — for anything substantial with real editable content (multiple fields, lists, actions)

### Final order, top to bottom

1. Profile — inline, always visible, not collapsible. Too important to hide behind a tap.
2. How It Works — collapsible reveal. Static explanatory text, no editing, so a simple expand/collapse is enough; doesn't need its own full screen.
3. Your Groups — stays open and visible, not collapsed, since a user may want to switch groups often. Lists every group the user belongs to; the currently active group is visually distinct (e.g. bolded) so everything below it has clear context. Directly beneath the active group's name, in this order: group code (for sharing), meeting day with time zone folded in (previously a separate field, now combined), member list. The separate "Group Info" box from earlier rounds is removed — it only duplicated the group name, which is now already shown here.
   - Bug found after Round 9 shipped, needs fixing: all of a user's groups must display together in one place, immediately visible under "Your Groups" — not with only the active group shown up top and other groups appearing further down the page. This was confusing in testing and does not match the original Round 9 intent.
   - Active-group reordering (see Round 10): switching your active group should move it to the top of the list, not just highlight it in place. The other groups drop below it, unhighlighted.
   - Edge case: a user cannot hide their currently active group. They must switch to a different active group first, then hide the one they just left. This prevents an active group from also sitting in the hidden list, which wouldn't make sense.
   - Gap caught after Round 9 shipped: removing the old Group Info box also removed the only way to rename a group. Fix: add a small edit icon or "Rename" link next to the bolded active group name itself, rather than reviving a separate box.
   - Member list ordering: pending join requests appear at the top (they need the leader's attention first), each showing the member's name with an Approve action. Below that, active and removed members, matching current behavior (active shown in green, removed shown greyed out with a Remove action available on active members) — this part is unchanged from how it already works, just repositioned within the new structure.
4. Weekly Questions — its own slide-over panel. Substantial editable content (5 questions, edit and reset actions) warrants a dedicated screen rather than an inline expand.
5. Bottom cluster, grouped together: Join a Group, Create a Group, and Deactivate This Group. These are all occasional, one-time-per-group-lifecycle actions, so they're grouped at the bottom rather than mixed in with routinely-referenced content above. Deactivate This Group should be visually distinct from Join/Create (e.g. red text or extra spacing) to signal it's a different category of action — ending something, not configuring it — even though the same confirmation-dialog safety net from before still applies and is what actually prevents accidental use.
6. Platform Admin section — only rendered for users with platform_admin set to true, unchanged from Round 3.
7. Logout — very bottom, unchanged.

### Goals editing moves from Settings to the check-in screen

A member's own goal-editing form currently lives in Settings. This moves to the check-in screen instead, directly beneath the Prayer & Life Update field, since setting personal goals is closer to weekly reflection than to app configuration.

- Prayer & Life Update stays exactly as-is: permanently open/visible on the check-in screen, no collapse
- Goals get a substantial, clearly labeled button (not a small text link) directly beneath it — tapping it reveals the 5 goal fields, styled with the same generous spacing and substantial feel as the rest of the check-in screen
- Unlike Prayer & Life Update, the goals section always starts collapsed and closed by default, every time the check-in screen is opened — even if a member had it open moments ago, navigating away (e.g. tapping Home) and back closes it again. This is deliberate: goals change rarely compared to the weekly rating and update, so keeping the primary check-in flow uncluttered takes priority over remembering the open/closed state.
- This entirely replaces the Settings-based goal editor — goals are edited in exactly one place, not two, to avoid the two locations drifting out of sync or confusing which one is authoritative
- Viewing another member's goals from the dashboard (the "See [Name]'s Goals" button, described earlier) is unaffected by this change — that remains on the dashboard as-is

## Round 10: Typography Scale, Branding Colors, and Visual Polish

This round applies the finalized brand colors from earlier (see the "Held for a later, dedicated styling round" note — that round is now happening) across the whole app in one pass, alongside a defined typography scale and a list of specific visual fixes found in real use.

### Typography scale — final, exact values (supersedes the earlier relative version below)

The original version of this section (kept just below for history) described sizes relatively — "at least as big as the Group Update label" — which proved too ambiguous across two earlier rounds and didn't get applied consistently. This is now replaced with an explicit, audited, real-device-tested scale. Apply these exact pixel values everywhere, with no exceptions unless a specific element genuinely can't fit one (see the utility tier note below):

- Page titles (e.g. "Dashboard," "Settings"): 24px, bold
- Section headers (e.g. "Your Groups," "Group Update," "How This Works"): 20px
- Body text, buttons, and all standard interactive labels (check-in questions, prayer updates, general reading text, the "Group Update" label itself): 17px — chosen deliberately to match iOS's own native body text default, since the app is used almost entirely on iPhones and should feel consistent with the rest of the phone
- Utility text — dashboard rating box labels (Strong/Good/Okay/Weak/Help), dashboard column headers, avatar initials: 12px. This tier is deliberately kept smaller than the others because these elements have limited physical space (e.g. rating box labels) — but before finalizing, actually test the rating boxes at whatever size the surrounding layout changes push them to. If 12px genuinely doesn't fit once real label text (like "HELP") is rendered inside, report back with options (shrink label wording, widen the box, or accept 11px on that specific element only) rather than shipping something visually broken.

This scale was determined by first auditing the actual current pixel sizes in the live app, then building a temporary side-by-side preview (16px vs 17px body text) viewed on a real phone before deciding — 17px was chosen as a genuine preference match to iOS's platform default, not a guess.

### Typography scale — original version, superseded above, kept for history

Currently there's no clearly defined type scale, and some text (the expanded history view, the "How It Works" description in Settings) is uncomfortably small. Define and apply consistently everywhere:

- Page titles (e.g. "Dashboard," "Settings") — largest, bold
- Section headers (e.g. "Group Update," "Your Groups") — second tier
- Button labels — clear and easily tappable
- Body text (check-in questions, prayer updates, general reading text) — a genuinely comfortable mobile reading size
- Hard floor: nothing in the app should ever render smaller than the current "Group Update" label size. This is the explicit minimum, including the two known current offenders (expanded history detail, Settings "How It Works" text), which must be brought up to at least this size.

### Brand colors — apply throughout

Use the finalized palette from earlier: #253551 (primary navy — headers, primary buttons, dashboard tab bar), #7993c2 (periwinkle accent — highlights, emphasis, anything meant to stand out), #ccd0d6 (light grey-blue — backgrounds, dividers, secondary/inactive states). Apply consistently across every screen, not just the login/landing page.

### Specific fixes

- Dashboard tab icon: replace the current icon with something resembling a car dashboard gauge, fitting the "dashboard" name
- "Your Goals" button on the check-in screen: needs real visual prominence (border, background fill, or accent color) — currently blends in and doesn't read as a button
- Goal input fields: current light grey text is hard to read; keep bold category titles and the boxed input style, but increase contrast and add clearer separation between each category so they don't visually run together
- Group Update box: the platform admin's ministry-wide link needs real visual weight — a distinct, prominent box, not a plain link — since driving people to it matters. The group-specific leader link stays a normal underlined text link by contrast, deliberately less prominent.
- Viewing a member's goals (dashboard drop-down): bold each category title, add spacing or light boxing between categories so they're easier to scan, without expanding this into multiple pages or excessive length
- Profile: add the ability to customize initials-circle color for members who don't upload a photo (see initials_circle_color in the Data Model above), so members without photos aren't all visually identical

### Dashboard row sizing (see also the collapsed row spec in Screens, above)

As font sizes increase per the new type scale, the 5 rating boxes need proportionally more room. First name text has been removed from the collapsed dashboard row entirely (see the updated Screens section) to make room — identification relies on the photo/initials circle, with full name shown immediately on tap into the expanded row. Confirmed acceptable given these are small, familiar groups.

## Round 11: Follow-Up From Round 10 Live Testing

Real use of Round 10 surfaced a few things — one real bug, one inconsistency, one thing that may not have fully applied, and one styling fix, plus confirmation of what's working well.

### Bottom nav icons unresponsive — real bug, priority fix

Bottom nav icons (Home, Dashboard, Settings) are now requiring multiple taps — 5 to 7 in some cases — before they register, even though the app otherwise feels faster since the performance fixes. This is a real functional bug, not a styling issue, and should be treated as a priority alongside the visual items below.

### Dashboard tab icon sizing inconsistency

The new gauge-style Dashboard icon itself looks fine, but it renders visibly smaller than the Home and Settings icons next to it. All three bottom nav icons should be sized consistently with each other.

### Font size — verify what actually changed

The typography scale from Round 10 doesn't seem to have made a noticeable difference in several places — text still feels too small in spots. Worth asking Claude Code to explicitly confirm what was actually changed against the Round 10 spec (the four-tier scale and the "never smaller than the Group Update label" floor), rather than assuming it was fully applied.

### Settings — Your Groups active/inactive contrast is backwards

In the "Your Groups" list, the currently active group's highlight color is too close to the surrounding background, so it doesn't stand out — while the non-active group (shown in white) visually pops more than the active one, which is backwards. Fix: use the periwinkle accent color (#7993c2) for the active group's highlight so it clearly stands out against both the white inactive group card and the grey page background behind it.

### Confirmed working well, no changes needed

- The overall dashboard redesign from Round 10, including the "Intentional Ministries" prominent button/box and the larger buttons generally
- Group renaming — implemented as an inline option within the group's own section (not a separate box), which works well and wasn't explicitly specified this way beforehand — this placement is approved as final

## Round 12: Onboarding Content, Login Screen, Goals Button, Help & Tips Structure, and Bug Reports

### Onboarding page fixes

- Fix stale wording: currently says something implying only the leader can see responses — this is outdated since Round 5 opened visibility to everyone in the group. Correct it to reflect that everyone in the group can see responses.
- Rename the "when things reset" section heading to "Weekly Reset"
- Replace the group code explanation with this exact, finalized wording — do not alter beyond fixing genuine spelling or grammar errors: "Every group is assigned a unique code. If you're joining a group, get the code from your leader — you'll then wait for approval from Settings before you can see the group. If you're starting a group, you're instantly placed in it as leader, with your own code generated automatically. You will need to share this code with your group members."
- Add a brief pointer noting that more detail is always available in Settings, reinforcing that onboarding is the short version and Settings is the full explanation (consistent with the pattern established in Round 6)
- Add the horizontal logo (IM_-_Horizontal_-_blue_with_grey.png) as a banner at the top of this page specifically

### Pending-approval waiting screen

After a member enters a group code, they land on a waiting screen that clearly indicates their request is pending approval. This screen should automatically advance to the home screen the moment the leader approves them, without requiring the member to refresh or reopen the app. If the member closes the app instead of waiting, no separate confirmation is needed — simply landing on the home screen (rather than the waiting screen) the next time they open the app is itself the confirmation they've been approved.

### Login screen redesign

- Navy (#253551) background
- Large, prominent logo — use IM_-_Main.png (vertical logo, square "I" mark, "INTENTIONAL" in blue, "MINISTRIES" in grey), sized meaningfully larger than its current small rendering
- No "Accountability App" or similar descriptive subtitle — the logo stands alone; by the time someone reaches this screen they already know what the app is
- Primary "Sign in" button uses the periwinkle accent color (#7993c2), consistent with periwinkle being reserved for primary/standout actions elsewhere in the app

### Goals button on check-in screen

Rename from "Your Goals" to "Manage Your Goals." Current periwinkle border-only styling isn't providing enough visual contrast — change to a solid fill (periwinkle or navy, whichever tests with better contrast against the surrounding check-in screen) rather than an outline.

### Help & Tips section — structure only, content tracked separately

Add a new "Help & Tips" row in Settings, using the same slide-over navigation pattern as Weekly Questions. Inside, six tappable topic buttons, each opening its own dedicated, fully scrollable page (back arrow returns to the Help & Tips list; another back arrow returns to Settings). Full normal reading font size on these pages — no shrinking just because it's help content. The six topics: adding the app to your home screen, joining or starting a group, your weekly rhythm, Prayer & Life Updates and reactions, goals, and a leader-specific topic. The actual written content for each topic is being drafted separately (see the "Help and Tips - Content Plan" reference document) and is not part of this round — build the navigation shell and structure now; content gets filled in afterward.

### Bugs to fix

- Password reset regression: this was tested and confirmed working earlier, but is now broken. Investigate as a regression — something in a recent round likely broke previously-working functionality, rather than starting the investigation from scratch.
- Email confirmation not sending for plus-addressed emails (e.g. you+leader2@gmail.com after you@gmail.com was already confirmed): likely cause is email normalization treating the plus-addressed variant as the same identity as the already-confirmed base address, so no new confirmation email is triggered. Needs investigation specifically around how email confirmation handles plus-addressing.
- PWA home screen icon shows a generic green checkmark instead of the actual logo when the app is saved to a phone's home screen. Configure IM_-_App_Icon_-_blue_with_white.png (or white_with_blue, whichever tests better) as the proper home screen icon.

## Round 13: Font Overflow Fixes, Question Title Wrapping, Help & Tips Correction, Editable Category Labels

### Rating selector buttons — dedicated size exception

The 5-way rating selector buttons on the check-in screen (Strong/Good/Okay/Weak/Help) are a narrow, fixed-width layout — five buttons across one row — and don't have room for the standard 17px button text; words like "Strong" touch or overflow the edges. This is a deliberate, documented exception to the standard type scale, not a scale-wide change: reduce specifically these five buttons to approximately 15px, adjusted until the longest label ("Strong") fits comfortably without touching the button edges.

### Question titles — auto-shrink to fit one line

Category titles on the check-in screen (e.g. "God — My Daily Walk with God," "Family — Loving and Leading My Family") should never wrap to a second line. Rather than picking one smaller fixed size for all five titles (which would unnecessarily shrink short titles that already fit fine), implement auto-shrink-to-fit: each title's font size reduces dynamically, only as much as needed, to stay on one line — short titles render at full size, longer ones shrink slightly on their own.

### Help & Tips — correction to Round 12's implementation

Round 12's written spec did not clearly capture the actual intent, and what got built reflects that gap — not a build error. Correct structure, replacing what's there now:

- "How This Works" is removed entirely, not left in place alongside the new content.
- In its exact former spot on the Settings page, show the 6 Help & Tips topics directly, as their own visible entries right on the Settings page — not hidden behind an intermermediate "Help & Tips" tap-through screen.
- Tapping any of the 6 topics slides over to its own dedicated detail page — one level of navigation deep, not two. Back arrow returns directly to Settings.
- Content for each of the 6 topics is already fully written — see the "Help and Tips - Content Plan" reference document.

### Editable one-word category labels

Currently, the one-word labels used for dashboard column headers and the category names shown in the goals view (God, Family, Work, Personal, Purity) are tied to fixed slot position, not to any editable field — confirmed through testing that editing a question's title or description does not affect these labels. Fix: add a third editable field to the question editor (short_label, see Data Model above) specifically for this one-word label, alongside the existing title and description fields. Dashboard column headers and the goals view should read from this new field instead of any hardcoded slot-based default. Default values remain God/Family/Work/Personal/Purity, but are now genuinely editable like everything else in the question editor.

## Round 14: Question Editor Labeling, Email Branding, Auto-Shrink Cap, and Settings Placement

### Question editor field label

Rename "Helper text" to "Full Description" in the question editor — same field, clearer label.

### Confirmation email branding and redirect

- The email confirmation link currently sends users back to the login screen after confirming, requiring them to log in again from scratch. Fix: confirming should log the user in automatically and carry them into onboarding, not dump them back at login looking like nothing happened.
- The confirmation email itself currently comes from a generic Supabase address, which looks jarring against the Intentional Ministries branding a user just saw on the login screen. This connects directly to the still-unresolved welcome email feature from Round 6, which has been on hold waiting for an email provider (e.g. Resend) — setting that up now would solve both problems at once: a properly branded "from" address for confirmation and password reset emails, and unlocking the welcome email feature that's been paused this whole time. Worth doing together rather than solving the branding piece in isolation and revisiting the provider question again later.

### "Check your email" screen should stay in theme

Currently, this screen reverts to a plain white background after the navy-themed login screen, breaking visual continuity. Fix: keep this screen in the same navy theme as login, rather than switching to white.

### Auto-shrink cap for question titles

Round 13's per-title auto-shrink is working correctly in principle, but revealed a new issue: short titles that don't need to shrink at all (specifically "God — My Daily Walk with God," the shortest of the 5) render at the algorithm's uncapped maximum size, looking dramatically larger than its neighbors even though each title is individually "correct" for its own length. Fix: cap the maximum size the auto-shrink range is allowed to reach, so even a short title can't render noticeably bigger than the others — the goal is visual consistency across all 5 titles, not just each one individually fitting on one line.

### Weekly Questions placement and styling in Settings

- Move the Weekly Questions entry to sit directly after Meeting Day and before Members, so it reads as part of the core group-configuration cluster (code, meeting day, questions) rather than appearing attached to or part of the Members section below it.
- Fix its text color, which currently renders black instead of the main navy blue (#253551 — not the periwinkle accent, #7993c2) used by other major buttons/links in Settings — should match.

### Help & Tips content — not part of this round

Content review is still in progress; will be included in a future round once finalized, not this one.

## Round 15: Meeting Date Display, Personal History Relocation, Header Cleanup, Nav Diagnostics, and Help & Tips Content

### Help & Tips — upload the actual content now

The navigation structure for Help & Tips was already built in Round 13 (six topics shown directly in Settings, each opening its own full page). This round adds the actual written content for all six pages — final, ready to upload as-is.

**1. Adding this to your home screen**

Why do this? This app lives on the web, not in the App Store — but you can still make it act like a normal app on your phone, with its own icon on your home screen and no browser bar cluttering the screen. It only takes a minute.

On iPhone (Safari):
1. Open the app link in Safari (this only works in Safari, not Chrome or another browser, on iPhone).
2. Tap the Share button — the square with an arrow pointing up, usually at the bottom of the screen.
3. Scroll down and tap "Add to Home Screen."
4. You can rename it if you want, then tap "Add" in the top right.
5. The app icon now appears on your home screen. Tap it any time to open the app full-screen, just like a downloaded app.

On Android (Chrome):
1. Open the app link in Chrome.
2. Tap the three-dot menu in the top right corner.
3. Tap "Add to Home screen," then confirm.
4. The app icon now appears on your home screen.

One-time only. You won't need to do this again — the icon stays on your home screen like any other app.

**2. Joining or starting a group**

Every group has its own unique code.

If you're joining a group: get the code from your leader and enter it when you sign up or from Settings. You'll then see a waiting screen while your leader reviews your request. Once approved, the app automatically takes you into the group — no need to check back or refresh anything.

If you're starting a group: you're instantly placed in it as leader, with your own unique code generated automatically. From there, it's your job to share that code with your guys. As they enter it, you'll see their requests waiting for your approval in Settings, under Your Groups — approve each one individually to let them in.

Belonging to more than one group? You can join or lead as many groups as you want. Switch between them anytime from Settings — whichever one you select becomes your active group, and everything you see (check-in, dashboard, history) reflects that group until you switch again.

**3. Your weekly rhythm**

The basics: each week, you rate yourself in 5 categories and can optionally add a Prayer & Life Update. This resets fresh every week, tied to your group's meeting day.

When does it lock? Your answers stay fully editable — change them as many times as you want — right up until 11:59 PM on your group's meeting day. After that, the week locks permanently. No exceptions, so make sure you've checked in before your group meets.

What if I miss a week? No problem. A missed week just shows as blank on the dashboard — it doesn't carry over anything from the week before, and it doesn't affect future weeks. Just check in again next week.

Can I look back at past weeks? Yes, two ways: your own personal history shows every week you've ever submitted, so you can spot your own patterns over time. You can also tap any group member's name on the dashboard to see their last 6 weeks — this works both ways, so others can do the same for you. It's meant to help the group actually follow up with each other, not just glance at the current week and move on.

If your leader changes the meeting day: your current week's deadline may shift as a result, but it will never create a short, rushed week — the app guarantees you'll always have at least a full week's notice.

**4. Prayer & Life Updates and reactions**

What is it? A short optional space on your weekly check-in — not just for prayer requests, but for anything you want your group to know: a struggle, a praise, an answered prayer, a life update. Whatever fits that week.

Who sees it? Your whole group, not just the leader. Tap into any member's name on the dashboard to read theirs, right alongside their name and phone number.

Reactions. Once you've read someone's update, you can tap a reaction — a heart, praying hands, a thumbs up, or raised hands for celebration. These are simple and anonymous: your group sees that someone reacted, not who specifically did. It's a quiet way to let a guy know he's been seen, without needing to type a message.

One thing to know: your update locks along with the rest of your answers once the week's deadline passes — but reactions stay open even after that, so someone can still respond to your update the next day or later, once it's sitting in history.

**5. Goals**

What are goals, and how are they different from the weekly check-in? Your 5 weekly ratings reset every week. Goals don't — they're something you set once for each category (like "consistent quiet times" or "memorize 10 scriptures") and they stay exactly as you left them until you decide to change them yourself. No weekly reset, no deadline.

Where do I find mine? On the check-in screen, right below your Prayer & Life Update, tap "Manage Your Goals" to open and edit them. It stays closed by default every time you open check-in, so it doesn't clutter your normal weekly routine — just tap it open whenever you actually want to look at or update them.

Can I see other people's goals? Yes — tap any group member's name on the dashboard, and you'll find a button to view their current goals in each category, right alongside their prayer updates and history.

**6. For leaders**

Group Update. A collapsible bar at the top of your dashboard where you can post a short message and an optional link to your group — use it for reminders, encouragement, or anything you want your guys to see before they check in. There's also a permanent ministry-wide link here, managed by Intentional Ministries, separate from anything you control.

Managing members. In Settings, under Your Groups, you'll find your group's member list. New join requests appear at the top — approve them to let someone in, or leave a request pending if you're not ready yet. You can also remove an active member at any time.

Changing your meeting day. You can update this anytime in Settings. The app will always guarantee at least a full week's notice before the change takes effect — you'll never end up with a short, rushed week as a result of changing the schedule.

Renaming your group. Tap the edit option next to your group's name under Your Groups.

Deactivating a group. When a group has truly run its course, you can deactivate it from Settings — you'll be asked to confirm first, since this isn't reversible. Once deactivated, every past member (even someone previously removed) can still see who was part of the group, though not each other's private answers — a simple, lasting record of who walked through it together.

### Welcome email button should pull its label text, not just its link, from the platform admin's resource field

The platform admin's ministry-wide resource box already has an editable title/label (recently changed to "Discipleship Resources") and an editable URL, both already working correctly for the in-app display. Confirmed working correctly. The welcome email's matching button currently pulls the URL from this same source, but its visible text is hardcoded ("This month's challenge") rather than reading from the same title field. Fix: the welcome email button should use both the label text and the URL from the platform admin's resource field, so editing it in one place updates both the app and the email consistently. No new field needed — connect the email template to the field that already exists.

### Sign-up (create account) screen should stay in theme

The navy branding was fixed on the login screen and the "check your email" waiting screen, but the sign-up screen itself — reached by tapping "Create a new account" from login, where you enter name, email, and password — was missed and still renders as a plain grey/white screen. Fix: bring this screen into the same navy theme as the rest of the auth flow (login → sign-up → check your email → welcome), so the whole sequence feels consistent rather than breaking theme partway through.

### Meeting date, not week-start date

Both the dashboard and the check-in screen currently show the current week's week_start_date (e.g. "Week of 8/17") — this is backward-looking and not useful to a user, since nobody needs to know when the cycle began. Replace it on both screens with the current week's actual meeting/lock date instead — the same date the app already calculates internally to enforce the deadline (see Weekly Cycle Rules above), just surfaced to the user. Label it something like "Meeting: [date]" rather than "Week of [date]." This should always read as the upcoming or current meeting, never a date in the past.

### Personal history moves from a standalone link to the dashboard, unified with the existing member-tap pattern

Remove the standalone "Your History" link from the top of the check-in screen entirely. Instead, extend the existing dashboard row-tap pattern: when a user taps their own row on the dashboard (the same gesture used to view any other member), the history button shows their complete, uncapped personal history instead of the standard 6-week cap that applies when viewing another member's row. Same interaction everywhere, different depth depending on whose row it is — your own row unlocks everything, any other member's row stays capped at 6 weeks as already built.

### Check-in screen header cleanup

SUPERSEDED — see Round 16 for the actual final layout. With the "Your History" link removed per above, the check-in header simplifies to four elements: group name, "This Week's Check-In" as the page title (proper title case, consistent with the Page Title tier of the type scale), the meeting date, and the "Hide Descriptions" toggle. The original description here (a horizontal row layout) was replaced in Round 16 with a stacked vertical layout instead — see Round 16 for the current, correct spec. No branding/logo repeated here — keep it clean, consistent with the login screen being the one strong branding moment in the app.

### Settings — move email out of the page header

The user's email currently sits awkwardly at the top of the Settings page, disconnected from the rest of their profile information (photo, name, phone) shown just below in the Profile section. Move it into Profile alongside those, and let the Settings page header simply read "Settings."

### Bottom nav icons — outline vs. filled states

Bottom nav icons currently look flat and don't clearly communicate which tab is active. Standard, well-established fix: inactive tabs use a lighter outline-style version of their icon; the currently active tab uses a solid/filled version of the same icon, colored with the navy or periwinkle accent. This gives a persistent, always-visible signal of the current screen, rather than only a brief flash of feedback on tap.

### Bottom nav responsiveness — diagnostic investigation needed

A new, more specific symptom beyond the earlier "needs multiple taps" report: sometimes a nav button doesn't respond to a normal tap at all, and holding it down instead opens a different, unintended screen. This suggests a touch-event handling issue, not just a performance issue — worth real diagnostic investigation into how the nav icons are set up as tap targets, rather than another guess-and-check styling fix.



This document is the spec. The database design (Data Model section) should be treated as fixed — build the screens, workflows, and permissions on top of it rather than changing its shape. Round 4 is urgent and should be sent and completed first. Round 5 and Round 6 can follow in either order, but Round 5 is the smaller, more self-contained of the two.

## Round 16: Check-in Header Restructure, Tab Rename, New Icons, Goals Button Fix

### Check-in screen header — full restructure

Revising the layout described in Round 15 — this supersedes it. Stack, top to bottom: group name, then "This Week's Check-In" as a large title spanning the width of the screen, then "Hide Descriptions" as a proper underlined link beneath that, then the meeting date at the bottom of this stack. All four elements stacked vertically, not split across a line with wasted space to the side.

### Rename "Home" tab to "Check-in"

The bottom nav tab currently labeled "Home" has always functionally been the check-in screen — rename the label to "Check-in" so the three tabs read as Check-in, Dashboard, Settings, matching how this screen has already been referred to throughout this document.

### Page titles across all three tabs need real visual weight

"This Week's Check-In," "Dashboard," and "Settings" should all render large and bold at the top of their respective screens — left-aligned for now, but with much more visual weight than currently, so each screen clearly announces what it is at a glance.

### New tab icons

Two style references were provided (generic stock icons, not final branded assets) — use these for shape and style only, then apply the app's actual brand colors (navy/periwinkle) to match everything else, not as literal pixel-perfect assets to drop in directly:

- Check-in tab: a document/checklist shape with a checkmark accent, matching the style of the reference image provided
- Dashboard tab: a gauge/speedometer shape, redesigned from the current version — a fuller sweep (roughly 75% of a circle, not the current smaller arc), a thicker/beefier dial needle, and tick marks along the gauge, matching the style of the reference image provided

### Manage Your Goals button — color and scroll fix

- Change the button's color from periwinkle to the main navy blue (#253551). It's currently the only element on the check-in screen using periwinkle, which reads as inconsistent rather than intentional.
- Fix the scroll behavior: currently, tapping the button (which sits near the bottom of the page) expands the goals content below the visible screen area, with no visual indication anything happened except the button's own label changing to "Hide Your Goals." Fix: when tapped, automatically scroll the page down just enough to bring the newly revealed goals content into view, so the action is immediately visible rather than requiring the user to notice the button change and manually scroll. This is a targeted scroll-into-view fix, not a change to the underlying interaction — it remains an inline expand (not a separate slide-over screen), and continues to close automatically when navigating away and back, exactly as it does now. Deliberately keeping it inline (not converting to its own screen) preserves the ability to scroll back and forth between the question descriptions above and the goals below while deciding what to write.

### Group Update expanded view — visual separation and link label

Real testing surfaced two separate problems in the expanded Group Update box, currently both crammed into one shared white area. Note: there is no line-break/text-formatting bug — text entry works correctly as-is; testing with different text simply made the visual separation problem below more obvious.

1. **Visual separation:** the ministry-wide resource button (e.g. "Discipleship Resources") and the leader's own group-specific content currently render in the same undifferentiated box, making the leader's content look like an unstructured extension of the button above it rather than its own distinct section. Fix: give the leader's content its own visually separate section (a distinct box, or at minimum clear spacing/a divider) beneath the ministry button.

2. **Raw URL display:** the leader's link currently displays as the literal full URL (e.g. "https://bibleproject.com/videos/..."), which is long, ugly, and overflows the screen. Fix: add a new field, group_update_link_label (see Data Model above), so the leader enters both a short clickable label ("Check out this video on 2 Peter") and the URL separately. Only the label displays, underlined and clickable — the raw URL is never shown directly to the group. If no URL is entered, no link displays at all — don't fall back to showing a raw URL if a label exists without one, or vice versa; both fields should be filled together or neither shows.



Discussed and settled: no additional branding is being added inside the app beyond the login/sign-up flow. A bare icon alone (without the full "INTENTIONAL MINISTRIES" wordmark) doesn't actually communicate anything meaningful on its own, and the existing discovery points (the Group Update resource link, the welcome email, Help & Tips) already serve the goal of driving traffic to the broader ministry resources. This is a final decision, not an open item.



