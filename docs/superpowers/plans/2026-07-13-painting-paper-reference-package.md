# GPT Work Reference Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prepare a reproducible local handoff package for analyzing a Douyin paper-collage video and building an interactive Vue website.

**Architecture:** Keep copyrighted reference media isolated under `reference/`; convert it into analysis frames with FFmpeg; store human-readable requirements under `docs/`; drive the eventual website from JSON manifests rather than hard-coded animation values.

**Tech Stack:** PowerShell, Bash, yt-dlp, FFmpeg, JSON Schema, Vue 3, TypeScript, GSAP, Vitest, Playwright.

## Global Constraints

- Never fabricate a reference MP4.
- The reference video is for internal analysis only.
- Build one painting first.
- The website must use true interactive layers, not embedded video.

### Task 1: Validate the handoff package

**Files:**
- Read: `README-FIRST.md`
- Read: `WORK_PROMPT.md`
- Run: `scripts/check-package.ps1` or `scripts/check-package.sh`

- [ ] Confirm all required text and JSON files exist.
- [ ] Confirm `reference/source.json` contains the supplied share URL and aweme ID.
- [ ] Confirm the package reports missing video honestly when MP4 is absent.

### Task 2: Acquire the reference video

**Files:**
- Create: `reference/reference-video.mp4`

- [ ] Run the platform download script.
- [ ] If blocked, save the video manually from Douyin and copy it to the exact path.
- [ ] Run `ffprobe` and confirm the file contains a readable video stream.

### Task 3: Generate analysis inputs

**Files:**
- Create: `reference/ffprobe.json`
- Create: `reference/frames/interval/*.jpg`
- Create: `reference/frames/scene/*.jpg`
- Create: `reference/audio/reference-audio.wav`
- Create: `reference/contact-sheets/overview.jpg`

- [ ] Run the reference preparation script.
- [ ] Confirm interval frames show temporal movement rather than only scene cuts.
- [ ] Confirm scene frames include major transitions.

### Task 4: Analyze and identify paintings

**Files:**
- Create: `docs/video-analysis.md`
- Create: `manifests/timeline-analysis.json`
- Modify: `assets/originals/sources.md`

- [ ] Identify each painting with confidence notes.
- [ ] Separate observed facts from implementation inferences.
- [ ] Locate public-domain source images and record licensing.

### Task 5: Build the first interactive painting

**Files:**
- Create: `src/**`
- Create: `manifests/paintings/painting-01.scene.json`
- Create: `assets/layers/painting-01/**`
- Create: `tests/**`

- [ ] Create real transparent image layers and repaired background.
- [ ] Build a reusable GSAP stage driven by the scene manifest.
- [ ] Add playback, scroll scrubbing, parallax and layer inspection.
- [ ] Run typecheck, unit tests, E2E tests and production build.
