# Graph Report - sofiasummitcenter-main  (2026-10-22)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 391 nodes · 667 edges · 51 communities (14 shown, 37 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- DUPX_Bootstrap
- lambda/handler.js
- index.js
- hrr-applications.test.mjs
- src/handler.js
- hrr.js
- lambda/package.json
- test/wp-signup.php
- wp-signup.php
- hrr-applications.js
- DUPX_CSRF
- bulgarian-hr-network/script.js
- backend/package.json
- preview-server.cjs
- hrr-auth.js
- analytics-consent.js
- init
- script.js
- test/script.js

## God Nodes (most connected - your core abstractions)
1. `DUPX_Bootstrap` - 35 edges
2. `handleHrr()` - 23 edges
3. `json()` - 20 edges
4. `fetch()` - 17 edges
5. `requireUser()` - 15 edges
6. `DUPX_CSRF` - 14 edges
7. `handler()` - 11 edges
8. `dskWebhook()` - 9 edges
9. `sendAttendeeTicketEmail()` - 9 edges
10. `clean()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `requireUser()` --calls--> `hrrUser()`  [EXTRACTED]
  backend/src/hrr.js → backend/src/hrr-auth.js
- `fetch()` --calls--> `handleHrr()`  [EXTRACTED]
  backend/src/index.js → backend/src/hrr.js
- `request()` --calls--> `handleHrr()`  [EXTRACTED]
  backend/test/hrr-authz.test.mjs → backend/src/hrr.js
- `scheduled()` --calls--> `processHrrApplicationOutbox()`  [EXTRACTED]
  backend/src/index.js → backend/src/hrr-applications.js
- `fetch()` --calls--> `handleHrrApplications()`  [EXTRACTED]
  backend/src/index.js → backend/src/hrr-applications.js

## Import Cycles
- None detected.

## Communities (51 total, 37 thin omitted)

### Community 1 - "lambda/handler.js"
Cohesion: 0.12
Nodes (38): adminAuthorized(), adminMarkPaid(), availability(), buildRawEmail(), calculate(), calculatePrice(), checkIn(), createInquiry() (+30 more)

### Community 2 - "index.js"
Cohesion: 0.16
Nodes (29): handleHrrApplications(), adminAuth(), asciiBytes(), base64(), buildPdf(), clean(), concatBytes(), cors() (+21 more)

### Community 3 - "hrr-applications.test.mjs"
Cohesion: 0.07
Nodes (16): makeDb(), setup(), validApplication, jwk, { privateKey, publicKey }, request(), token(), assert (+8 more)

### Community 4 - "src/handler.js"
Cohesion: 0.12
Nodes (23): cors(), createRegistration(), crypto, db, {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand
}, eventBody(), eventConfig(), handler() (+15 more)

### Community 5 - "hrr.js"
Cohesion: 0.29
Nodes (24): addMentor(), archiveMission(), isStudentPreviewUser(), clean(), createMission(), createTeam(), currentSeason(), handleHrr() (+16 more)

### Community 6 - "lambda/package.json"
Cohesion: 0.10
Nodes (20): dependencies, @aws-sdk/client-dynamodb, @aws-sdk/client-sesv2, name, private, scripts, test, type (+12 more)

### Community 7 - "test/wp-signup.php"
Cohesion: 0.24
Nodes (14): confirm_another_blog_signup(), confirm_blog_signup(), confirm_user_signup(), show_blog_form(), show_user_form(), signup_another_blog(), signup_blog(), signup_get_available_languages() (+6 more)

### Community 8 - "wp-signup.php"
Cohesion: 0.24
Nodes (14): confirm_another_blog_signup(), confirm_blog_signup(), confirm_user_signup(), show_blog_form(), show_user_form(), signup_another_blog(), signup_blog(), signup_get_available_languages() (+6 more)

### Community 9 - "hrr-applications.js"
Cohesion: 0.30
Nodes (14): base64url(), clean(), deliver(), googleAccessToken(), html(), json(), makeId(), now() (+6 more)

### Community 11 - "bulgarian-hr-network/script.js"
Cohesion: 0.17
Nodes (9): form, guestsSection, guestTrack, hero, heroPhotos, status, story, storyCards (+1 more)

### Community 12 - "backend/package.json"
Cohesion: 0.22
Nodes (8): dependencies, pdf-lib, @pdf-lib/fontkit, scripts, test, type, pdf-lib, @pdf-lib/fontkit

### Community 13 - "preview-server.cjs"
Cohesion: 0.22
Nodes (5): fs, http, path, root, types

### Community 14 - "hrr-auth.js"
Cohesion: 0.52
Nodes (6): base64UrlToBytes(), decodePart(), getJwks(), hrrUser(), STUDENT_PREVIEW_EMAILS, verifyHrrAccessToken()

### Community 15 - "analytics-consent.js"
Cohesion: 0.53
Nodes (4): loadTracking(), makeBanner(), saveConsent(), wireExistingBanner()

## Knowledge Gaps
- **1 isolated node(s):** `qrcode`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 167 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `handleHrr()` connect `hrr.js` to `index.js`, `hrr-applications.test.mjs`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `qrcode` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DUPX_Bootstrap` be split into smaller, more focused modules?**
  _Cohesion score 0.08084163898117387 - nodes in this community are weakly interconnected._
- **Why does `@aws-sdk/lib-dynamodb` connect `lambda/package.json` to `lambda/handler.js`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `lambda/handler.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11923076923076924 - nodes in this community are weakly interconnected._
- **Should `hrr-applications.test.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.07007575757575757 - nodes in this community are weakly interconnected._
- **Should `src/handler.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11822660098522167 - nodes in this community are weakly interconnected._