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

Deadline
- Deadline is 11:59 PM local group time, the day before the meeting day
- No grace period
- The week stays editable — members can change their answers as many times as they want — until the deadline. Last saved value wins.
- After the deadline, the week locks permanently. No edits, no exceptions.

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

Note: group membership is not stored on the User record — Membership is the source of truth for that.

Group
- Group name
- Group code (for joining)
- Meeting day (Monday–Sunday)
- Time zone (IANA format, e.g. America/Chicago)
- Creator
- Active/inactive flag
- Slug (for a clean URL)
- resource_link_url (text, optional)
- resource_link_label (text, optional)

Membership (connects a User to a Group)
- user, group
- role: admin or member
- status: active, inactive, pending, removed
- joined date

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
- updated_at

One record holds all five ratings together, plus that week's prayer request. week_start_date never changes once written. Locked weeks are immutable.

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

Dashboard screen (visible to the whole group, not just the admin)
- One row per group member, current week only
- Name (or initials, or profile photo) on the left
- That member's 5 answers shown as colored, labeled buttons across the row, in question order — the question text itself is not restated on this screen, just the answers, since the order alone tells you which category is which
- Tapping a member's name opens that member's detail — including their prayer request for the week, if they submitted one
- The entire group should be readable in one glance — this is the main design goal

Personal history screen (each member's own view, private to them)
- A scrollable list of past weeks, most recent first
- Each week shows that week's date and the same 5 colored, labeled buttons the member chose that week
- Purpose: let a member spot his own patterns over time — for example, noticing the same category has been weak for six weeks running, even if the other four have been consistently strong

Prayer requests
- Part of the weekly check-in — each week, a member can optionally add a short prayer request alongside his 5 ratings
- Visible to the rest of the group by tapping that member's name on the dashboard, not shown inline in the main grid

Settings screen
- User Profile
- Group Settings (per group, since a user can be in more than one) — includes the group's resource link, editable by the admin
- Bottom navigation: Home, Dashboard, Group, Settings

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
- Leader-only member history view: from the dashboard, a leader can tap a member's name and see that member's own check-ins (ratings and Prayer & Life Updates) for roughly the last 6 weeks. This is leader-only, not visible to other regular members — it supports pastoral follow-up, not general group browsing of each other's history. Do not build a separate whole-group historical dashboard snapshot feature for v1 — this one member-level view covers the real need.
- Member removal: leader can remove a member from a group, which sets their Membership status to removed and immediately cuts off their access. Do not auto-regenerate the group code when someone is removed — that would also lock out every other current member for no reason. If a removed person re-enters the group code later, it should simply create a new pending join request like any other join attempt, which the leader can ignore or deny — no separate "block" feature needed.
- A short onboarding explainer at the signup/join step — a screen or slide-through that briefly explains what to expect (the weekly rhythm, when things reset, what the group code is for, what happens once approved). Sequence this after the current bug-fix round, not before.

### Usability fix bundled into this round (not a styling pass)

- Add a small label above each of the 5 columns on the dashboard (God, Family, Work, Personal, Purity, or whatever short form fits) so members don't have to memorize question order to read the grid. This is functional, not decorative — bundle it with the bug fixes above rather than waiting for a dedicated styling round.

### Held for a later, dedicated styling round

- Bottom navigation icons instead of text labels
- Overall color palette and visual polish once brand colors and an app icon are finalized

## Handoff Note for Claude Code

This document is the spec. The database design (Data Model section) should be treated as fixed — build the screens, workflows, and permissions on top of it rather than changing its shape. Start with one working group end-to-end (create group → answer check-in → see it on the dashboard) before generalizing to support many independent groups. The Round 2 section above reflects the current priority: fix what's broken and add the confirmed small features first, hold cosmetic styling for a dedicated later pass.
