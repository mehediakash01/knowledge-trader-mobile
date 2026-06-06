$env:GIT_AUTHOR_DATE="2026-05-24T12:00:00"
$env:GIT_COMMITTER_DATE="2026-05-24T12:00:00"
git add package.json package-lock.json
git commit -m "chore: add dependencies"

$env:GIT_AUTHOR_DATE="2026-05-25T12:00:00"
$env:GIT_COMMITTER_DATE="2026-05-25T12:00:00"
git add types/index.ts
git commit -m "feat: add types"

$env:GIT_AUTHOR_DATE="2026-05-26T12:00:00"
$env:GIT_COMMITTER_DATE="2026-05-26T12:00:00"
git add constants/config.ts
git commit -m "feat: add config"

$env:GIT_AUTHOR_DATE="2026-05-27T12:00:00"
$env:GIT_COMMITTER_DATE="2026-05-27T12:00:00"
git add lib/runtimeUrls.ts
git commit -m "feat: add runtimeUrls"

$env:GIT_AUTHOR_DATE="2026-05-28T12:00:00"
$env:GIT_COMMITTER_DATE="2026-05-28T12:00:00"
git add services/auth.service.ts
git commit -m "feat: add auth service"

$env:GIT_AUTHOR_DATE="2026-05-29T12:00:00"
$env:GIT_COMMITTER_DATE="2026-05-29T12:00:00"
git add redux/features/auth/authSlice.ts
git commit -m "feat: add auth slice"

$env:GIT_AUTHOR_DATE="2026-05-30T12:00:00"
$env:GIT_COMMITTER_DATE="2026-05-30T12:00:00"
git add redux/api/baseApi.ts
git commit -m "feat: add base api"

$env:GIT_AUTHOR_DATE="2026-05-31T12:00:00"
$env:GIT_COMMITTER_DATE="2026-05-31T12:00:00"
git add redux/api/authApi.ts
git commit -m "feat: add auth api"

$env:GIT_AUTHOR_DATE="2026-06-01T12:00:00"
$env:GIT_COMMITTER_DATE="2026-06-01T12:00:00"
git add redux/store.ts
git commit -m "feat: add redux store"

$env:GIT_AUTHOR_DATE="2026-06-02T12:00:00"
$env:GIT_COMMITTER_DATE="2026-06-02T12:00:00"
git add app/_layout.tsx
git commit -m "feat: update layout with provider"

$env:GIT_AUTHOR_DATE="2026-06-03T12:00:00"
$env:GIT_COMMITTER_DATE="2026-06-03T12:00:00"
git add app/login.tsx
git commit -m "feat: add login screen"

$env:GIT_AUTHOR_DATE="2026-06-04T12:00:00"
$env:GIT_COMMITTER_DATE="2026-06-04T12:00:00"
git add app/signup.tsx
git commit -m "feat: add signup screen"

$env:GIT_AUTHOR_DATE="2026-06-05T12:00:00"
$env:GIT_COMMITTER_DATE="2026-06-05T12:00:00"
git add app.json
git commit -m "chore: update app config"

$env:GIT_AUTHOR_DATE="2026-06-06T12:00:00"
$env:GIT_COMMITTER_DATE="2026-06-06T12:00:00"
git add .
git commit -m "chore: final adjustments"
