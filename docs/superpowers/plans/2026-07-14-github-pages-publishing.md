# GitHub Pages Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the current Vite application at `https://god2father.github.io/gptwork-painting-paper/` through GitHub Pages.

**Architecture:** Keep the application unchanged and add only repository-path asset handling plus one official GitHub Pages Actions workflow. GitHub builds `dist` from `main`, uploads it as a Pages artifact, and deploys it to the `github-pages` environment.

**Tech Stack:** Vite 8, Vue 3, Node.js 20, GitHub Actions, GitHub Pages REST and Git Data APIs.

## Global Constraints

- Do not add runtime or development dependencies.
- Do not change the website design or interaction.
- Do not change repository visibility automatically.
- Keep deployment reversible by removing the workflow and Vite `base` setting.
- Treat this as a configuration-only change: verify with production output and the real Pages deployment instead of adding a source-code unit test.

---

### Task 1: Build for the GitHub Pages repository path

**Files:**
- Modify: `vite.config.ts`

**Interfaces:**
- Consumes: GitHub Pages project URL path `/gptwork-painting-paper/`.
- Produces: Vite build output whose generated asset URLs begin with `/gptwork-painting-paper/`.

- [ ] **Step 1: Record the missing production path**

Run the current build and inspect `dist/index.html`:

```powershell
npm run build
rg 'src="/gptwork-painting-paper/|href="/gptwork-painting-paper/' dist/index.html
```

Expected before the change: the search exits with code 1 because asset URLs use `/assets/...`.

- [ ] **Step 2: Add the repository base path**

Update `vite.config.ts`:

```ts
export default defineConfig({
  base: '/gptwork-painting-paper/',
  plugins: [vue()],
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 3: Verify the production path**

```powershell
npm run build
rg 'src="/gptwork-painting-paper/|href="/gptwork-painting-paper/' dist/index.html
```

Expected: the build exits with code 0 and the search prints the generated script and stylesheet URLs.

---

### Task 2: Deploy `dist` with the official Pages workflow

**Files:**
- Create: `.github/workflows/pages.yml`

**Interfaces:**
- Consumes: `main`, `package-lock.json`, and Task 1's `dist` output.
- Produces: a GitHub Pages deployment in the `github-pages` environment.

- [ ] **Step 1: Add the workflow**

Create `.github/workflows/pages.yml` with `push` on `main` and `workflow_dispatch`, permissions `contents: read`, `pages: write`, and `id-token: write`. Use Node.js 20, `npm ci`, `npm run build`, `actions/configure-pages`, `actions/upload-pages-artifact` with `path: ./dist`, and `actions/deploy-pages`.

- [ ] **Step 2: Run the complete local verification**

```powershell
npm test -- --run
npm run typecheck
npm run build
git diff --check
```

Expected: tests, type checking, and build exit with code 0; `git diff --check` reports no whitespace errors.

- [ ] **Step 3: Commit the deployment configuration**

```powershell
git add vite.config.ts .github/workflows/pages.yml docs/superpowers/plans/2026-07-14-github-pages-publishing.md
git commit -m "ci: publish site to GitHub Pages"
```

---

### Task 3: Enable Pages, synchronize, and verify the live URL

**Files:**
- No additional repository files.

**Interfaces:**
- Consumes: the verified local Git tree and GitHub repository `god2father/gptwork-painting-paper`.
- Produces: an accessible Pages URL and a successful Actions deployment.

- [ ] **Step 1: Enable GitHub Actions as the Pages source**

Use `POST /repos/god2father/gptwork-painting-paper/pages` with `{"build_type":"workflow"}`. If Pages already exists, use `PUT` with the same body. Do not change repository visibility if GitHub rejects private-repository Pages.

- [ ] **Step 2: Synchronize the exact local tree through Git Data API**

Upload missing blobs, create a full tree, verify its SHA equals `git rev-parse HEAD^{tree}`, create a commit whose parent is the current remote `main`, then update `refs/heads/main` without force.

- [ ] **Step 3: Monitor the workflow**

Use GitHub Actions metadata and logs until the Pages workflow succeeds or yields a specific blocking error.

- [ ] **Step 4: Verify the published page**

Open `https://god2father.github.io/gptwork-painting-paper/` and confirm the response loads the app, static assets return successfully, and the primary interactive stage is visible.

- [ ] **Step 5: Report the final URL and verification**

Return the clickable URL, the workflow result, and any remaining access restriction.
