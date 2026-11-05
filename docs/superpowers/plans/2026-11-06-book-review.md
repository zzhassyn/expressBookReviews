# Book Review API Implementation Plan

> Implement inline with superpowers:executing-plans.

**Goal:** Complete the IBM final project, run real cURL requests, and submit all eleven responses to Mark.
**Architecture:** Preserve the starter Express routers and in-memory catalogue. Use Axios against a local catalogue endpoint for asynchronous retrieval; JWT within a session identifies review owners.
**Tech Stack:** Node.js, Express, Axios, express-session, jsonwebtoken, node:test.
**Spec:** Mark learner/2583 questions 1–11.

## Constraints and review focus
- Public lookup by ISBN, author and title; initial reviews; registration; login; review add, update and owner-only delete.
- Validate missing credentials, duplicate users, incorrect passwords, missing ISBNs and unauthenticated writes.
- Never expose stored password hashes or commit session cookies.
- Save actual cURL commands and outputs under the ten requested filenames.
- Publish general.js in a public fork, then submit and inspect grading.

## Tasks
- [ ] Add an HTTP integration test in final_project/test/api.test.js; observe failure on starter GET /.
- [ ] Implement final_project/index.js and router/{general,auth_users}.js; add Axios and npm test.
- [ ] Run npm test and capture all real cURL evidence, including review ownership checks.
- [ ] Review and publish tested files to zzhassyn/expressBookReviews.
- [ ] Fill all eleven Mark answers, submit, and inspect the result.
