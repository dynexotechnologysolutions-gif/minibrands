MiniBrands — Responsive UI Debugging & Refinement Skill

Version: 1.0
Project: MiniBrands Marketplace
Role: Senior Frontend Engineer + UI/UX Engineer + Responsive Design Specialist

1. Purpose

This skill is used whenever a MiniBrands page or component has:

Broken mobile layouts
Incorrect width or height
Text wrapping incorrectly
Components becoming unusually narrow
Buttons overflowing or being clipped
Cards becoming distorted
Header/content overlap
Bottom navigation overlap
Incorrect spacing or alignment
Horizontal scrolling
Desktop styles leaking into mobile
Empty states looking broken
Components looking inconsistent with the design system
Different components using inconsistent layouts

The objective is to identify and fix the root layout problem, not to apply superficial CSS patches.

2. Core Engineering Principle
NEVER patch symptoms before identifying the cause.

When a component looks broken:

Visual Problem
      ↓
Inspect DOM hierarchy
      ↓
Inspect parent containers
      ↓
Inspect width constraints
      ↓
Inspect flex/grid behavior
      ↓
Inspect responsive classes
      ↓
Inspect overflow rules
      ↓
Identify root cause
      ↓
Apply smallest correct fix
      ↓
Validate all breakpoints

Do not immediately add:

w-full
max-w-md
overflow-hidden
px-4
min-w-0

unless the actual layout structure requires it.

3. Root-Cause Investigation

Before modifying code, inspect:

Parent Layout

Check:

display
flex
grid
flex-direction
grid-template-columns
gap
align-items
justify-content
width
max-width
min-width
height
max-height
min-height
Child Layout

Check:

flex
flex-shrink
flex-grow
basis
w-*
max-w-*
min-w-*
truncate
whitespace-*
break-*
overflow-*
Responsive Classes

Inspect for incorrect combinations such as:

grid-cols-6
sm:grid-cols-2
md:grid-cols-4

or:

w-[300px]

without a mobile override.

Check:

base → sm → md → lg → xl

and determine which class is actually active at each viewport.

4. Mobile-First Debugging

Always test the following widths:

320px
360px
375px
390px
414px
768px
1024px
1280px
1440px

Minimum required mobile validation:

320px
360px
375px
414px

Never assume that fixing 375px automatically fixes 320px.

5. Width & Container Rules

For mobile components, prefer:

w-full
max-w-* 
mx-auto
px-4

when appropriate.

Avoid fixed widths such as:

w-[500px]
w-[300px]
width: 500px

unless they are explicitly required.

Avoid nested width restrictions such as:

parent: max-w-xs
child: max-w-sm
grandchild: w-[400px]

unless intentionally designed.

Important

If text is wrapping one word per line:

Nothing
saved
yet.

Save
products
you
love
while
catalog
browsing

do NOT immediately modify typography.

First inspect:

container width
parent width
grid columns
flex basis
max-width
min-width
shrink behavior

The problem is frequently caused by a parent container becoming too narrow.

6. Text Wrapping Rules

Text should wrap naturally.

Avoid:

word-break: break-all;

unless explicitly required.

Avoid arbitrary:

max-width: 80px
width: 100px

for normal paragraphs.

Prefer:

max-w-prose
max-w-md
w-full

where appropriate.

Headings

Headings should:

Maintain readable line length
Avoid unnecessary single-word wrapping
Maintain visual hierarchy
Have appropriate line-height
Never overflow the viewport
Paragraphs

Paragraphs should:

Have readable width
Use natural wrapping
Have comfortable line-height
Never create extremely narrow columns
7. Flexbox Debugging Rules

When using flex:

Check:

flex-shrink
flex-grow
flex-basis
min-width
width

A common mobile bug occurs when:

flex child
+
fixed width
+
flex-shrink
+
parent constraint

causes the child to collapse.

Use:

min-w-0
w-full
flex-1

only when appropriate to the actual layout.

Do not blindly add min-w-0.

8. Grid Debugging Rules

Inspect:

grid-cols-*
gap-*
col-span-*

A common problem is a desktop grid leaking into mobile.

Example:

grid-cols-6

may produce extremely narrow cards on mobile.

Prefer responsive behavior such as:

grid-cols-2
sm:grid-cols-3
lg:grid-cols-4

when appropriate for the component.

Never change the grid count without understanding the intended product/design layout.

9. Empty-State Design Rules

Empty states must be treated as a complete UI composition.

Structure:

Empty State
├── Illustration
├── Heading
├── Description
└── Primary CTA

Recommended structure:

w-full
max-w-md
mx-auto
px-4 / px-6
text-center

Example:

             ♡

      Nothing saved yet.

   Save products you love while
   browsing, and they will appear
   here.

   [ Explore Fashion Collections ]

The content must remain visually balanced across mobile widths.

Never allow the empty state to become a narrow vertical column.

10. Button Rules

Buttons must:

Be fully visible
Never overflow the viewport
Have minimum 44×44px touch area
Have sufficient horizontal padding
Have consistent border radius
Respect the MiniBrands button hierarchy

Primary:

Brand Pink
#FF3E6C

Buttons should not be clipped by:

overflow-hidden
fixed-width parent
incorrect flex layout

Do not solve button overflow by reducing font size unnecessarily.

Fix the container first.

11. Header & Navigation Safety

Every mobile page must account for:

Mobile Header
+
Page Content
+
Bottom Navigation
+
Safe Areas

Content must never hide behind:

Header
Bottom navigation
Sticky CTA
Browser safe area
iOS home indicator

Use the project's existing spacing architecture before introducing new padding values.

Do not repeatedly add:

pb-24
pb-28
pt-20
pt-24

to individual pages if a global navigation shell already handles this.

12. Fixed Bottom Navigation

When a fixed mobile navigation exists:

position: fixed
bottom: 0

page content must have sufficient bottom space.

The solution should account for:

navigation height
safe-area-inset-bottom
sticky purchase bars

If multiple fixed elements exist:

Sticky CTA
      ↓
Bottom Navigation
      ↓
Safe Area

calculate their combined occupied space.

Never allow important CTAs to become hidden underneath navigation.

13. Mobile Header Rules

Mobile headers must:

Remain within viewport width
Respect safe-area top
Avoid covering page content
Avoid excessive height
Avoid unnecessary controls
Maintain consistent alignment

Before adding page-specific padding:

inspect actual header height
inspect position
inspect safe-area handling
inspect shell architecture

Do not create different arbitrary header offsets on every page.

14. Design System Compliance

All UI fixes must follow the MiniBrands design system.

Brand
Primary Pink: #FF3E6C
Deep Navy: #111827
Background: #FFFFFF
Secondary Background: #F8F8FA
Border: #F3F4F6
Secondary Text: #6B7280
Muted Text: #9CA3AF
Spacing

Use the:

8px spacing grid

Prefer:

8
16
24
32
40
48
64

instead of arbitrary spacing values.

Radius

Cards:

20–24px

Inputs:

12–16px

Pills:

999px
Typography

Primary font:

Manrope

Fallback:

Inter

Maintain:

heading hierarchy
line-height
font-weight
natural wrapping
15. Component Reuse Rule

Before creating a new component:

Search existing components
      ↓
Check existing design tokens
      ↓
Check existing utilities
      ↓
Reuse canonical component
      ↓
Only create new component if necessary

Do not create duplicate components for visually identical UI.

For example, if the project already has:

ProductCard

do not create:

WishlistProductCard
RecentlyViewedCard
ExploreProductCard

unless their behavior genuinely differs.

16. Responsive Desktop Protection

If the requirement is mobile-only:

DO NOT modify desktop behavior.

Use responsive classes and isolated mobile components where possible.

Example:

mobile: md:hidden
desktop: hidden md:block

Before finishing, explicitly verify:

Desktop UI unchanged
Desktop spacing unchanged
Desktop navigation unchanged
Desktop product cards unchanged
Desktop functionality unchanged
17. Do Not Use Fake Data

Never introduce:

Mock products
Fake prices
Placeholder product images
Fake wishlist items
Hardcoded counts

if real application data already exists.

Always trace:

UI
↓
Component
↓
Props
↓
Hook
↓
Query
↓
API / Server Action
↓
Database

Use the real data source.

18. Do Not Modify Backend for Presentation Bugs

If the issue is:

width
spacing
alignment
responsive behavior
visual hierarchy
overflow
header overlap
navigation overlap

do not modify:

Prisma
API
database
authentication
server actions
business logic

unless the investigation proves the backend is the actual cause.

19. Accessibility

Every responsive fix must preserve:

Touch

Minimum:

44×44px

Prefer:

48×48px

for primary mobile navigation controls.

Keyboard

Maintain:

focus-visible

states.

Screen Readers

Use:

aria-label
aria-current
semantic HTML

where required.

Reduced Motion

Respect:

prefers-reduced-motion
20. Performance

Avoid unnecessary:

JavaScript layout calculations
resize listeners
scroll listeners
large client components

Prefer CSS responsive behavior when possible.

Avoid introducing expensive animation for simple layout changes.

Use:

transform
opacity

for animations.

Avoid animating:

width
height
top
left
margin
padding

when possible.

21. Visual Debugging Process

When given a screenshot of a broken UI:

Step 1 — Identify the visible symptom

Example:

Content is extremely narrow.
Step 2 — Locate the component

Determine:

page
component
parent component
layout wrapper
navigation shell
Step 3 — Inspect parent hierarchy

Trace:

body
→ page shell
→ main
→ section
→ card
→ content
Step 4 — Find the first incorrect constraint

Look for:

width
max-width
grid
flex
padding
margin
overflow
position
Step 5 — Fix the smallest responsible layer

Prefer:

one root layout correction

over:

five child-level CSS patches
Step 6 — Validate

Test:

320
360
375
390
414
768
1280
1440
22. Screenshot Comparison Rule

When a screenshot is provided:

Use it as evidence of the visual problem.

Compare:

Expected
vs
Current

Check:

Container width
Alignment
Spacing
Typography
Image size
Button position
Header position
Bottom navigation
Overflow
Empty space

Do not blindly reproduce the screenshot if doing so conflicts with the MiniBrands design system.

23. Implementation Strategy

Before coding, produce a short internal diagnosis:

Problem:
...

Root Cause:
...

Affected Component:
...

Parent Constraint:
...

Correct Fix:
...

Desktop Risk:
...

Mobile Validation:
...

Then implement the fix.

Do not rewrite the entire page unless necessary.

24. Validation Checklist

Before declaring completion:

Layout

No horizontal overflow

No collapsed containers

No accidental narrow columns

No overlapping components

No clipped buttons

No broken text wrapping

Correct alignment

Correct spacing

Mobile

320px tested

360px tested

375px tested

390px tested

414px tested

Navigation

Header does not cover content

Bottom navigation does not cover content

Sticky CTA does not overlap navigation

Safe areas work correctly

Design

MiniBrands design system followed

Typography consistent

Colors consistent

Border radius consistent

Spacing follows 8px grid

Existing components reused

Functionality

Existing functionality unchanged

Existing routes unchanged

Existing APIs unchanged

Existing authentication unchanged

Existing database logic unchanged

Code Quality

No unnecessary components

No duplicate UI implementation

No mock data introduced

No arbitrary CSS hacks

No unnecessary !important

TypeScript passes

ESLint passes

25. Required Commands

Run:

npx tsc --noEmit

Then run the relevant ESLint check for the modified files.

If browser tooling is available, visually inspect:

320px
360px
375px
390px
414px
768px
1280px
1440px
26. Definition of Done

A responsive UI issue is considered fixed only when:

The root layout constraint has been corrected, the component behaves naturally across supported breakpoints, the MiniBrands design system is preserved, desktop behavior remains unchanged where required, and no new layout hacks or duplicated components have been introduced.

The implementation must be:

Responsive + Clean + Reusable + Accessible + Consistent + Production-ready.