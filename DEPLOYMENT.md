# Deployment

This app deploys to shared hosting via GitHub Actions. CI builds the artifact
(Composer + Vite), then rsync ships the built files to the server over SSH.

- **Workflow:** [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
- **Rsync excludes:** [.rsyncignore](.rsyncignore)
- **Trigger:** push to `main`, or manual run via the Actions UI
- **Server app dir:** `/home/credftus/creditco/`
- **Web root (subdomain doc root):** `/home/credftus/creditco/public/`
- **Server PHP:** 8.2

> **Off limits:** `/home/credftus/public_html/` belongs to a different domain.
> The workflow never touches it, and you shouldn't either.

---

## 1. Required GitHub secrets

Set these under **Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `SSH_HOST` | Server hostname or IP (e.g. `creditco.example.com`) |
| `SSH_USER` | `credftus` |
| `SSH_PORT` | SSH port (often non-standard on shared hosting — check cPanel) |
| `SSH_PRIVATE_KEY` | Private half of a deploy-only SSH keypair (see below) |
| `SSH_KNOWN_HOSTS` | Output of `ssh-keyscan` for your server (see below) |

### Generate a deploy keypair

On your local machine, create a key that's dedicated to this deploy (don't reuse
your personal key):

```bash
ssh-keygen -t ed25519 -C "github-actions deploy creditco" -f ~/.ssh/creditco_deploy -N ""
```

This produces two files:

- `~/.ssh/creditco_deploy` — **private** key, goes into the `SSH_PRIVATE_KEY` secret
- `~/.ssh/creditco_deploy.pub` — **public** key, goes onto the server

Paste the entire private key (including `-----BEGIN ...` and `-----END ...` lines):

```bash
cat ~/.ssh/creditco_deploy | pbcopy   # macOS — then paste into SSH_PRIVATE_KEY
```

### Authorize the public key on the server

SSH into the server one time using your existing access (password or master
key), then append the deploy public key:

```bash
ssh -p <port> credftus@<host>
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "<paste contents of creditco_deploy.pub here>" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Test from your local machine that the deploy key works:

```bash
ssh -i ~/.ssh/creditco_deploy -p <port> credftus@<host> "echo ok && pwd"
```

You should see `ok` and `/home/credftus`. If you get a password prompt or
permission denied, the public key isn't installed correctly.

### Generate `SSH_KNOWN_HOSTS`

This pins the server's host key so CI can verify it's talking to the right
server (and not a MITM). From your local machine:

```bash
ssh-keyscan -p <port> -H <host>
```

Copy the **entire output** (usually 2–3 lines) into the `SSH_KNOWN_HOSTS` secret.

---

## 2. One-time server setup

These steps are manual and only need to happen once per server.

### Subdomain (cPanel)

In cPanel → **Domains** → **Subdomains**, create the subdomain and set its
document root to `/home/credftus/creditco/public/`.

> Do **not** use a symlink-based setup. The web root must point directly at
> Laravel's `public/` dir.

### `.env`

Place the production `.env` at `/home/credftus/creditco/.env`. It is excluded
from rsync, so the deploy will never overwrite it.

Generate `APP_KEY` once:

```bash
ssh credftus@<host>
cd /home/credftus/creditco
php artisan key:generate --force
```

### Directory permissions

```bash
cd /home/credftus/creditco
chmod -R 775 storage bootstrap/cache
```

If your shared host uses a different user/group for the webserver, check
cPanel's recommended permissions — sometimes 755 is correct instead.

### Storage symlink

```bash
cd /home/credftus/creditco
php artisan storage:link
```

This creates `public/storage` → `../storage/app/public`. It's intentionally
omitted from the workflow because it's a one-time, environment-specific step.
The symlink is also added to `.rsyncignore` so deploys won't clobber it.

### First deploy

After the one-time setup, push to `main` (or run the workflow manually). The
first deploy will populate `vendor/`, `public/build/`, and run migrations.

---

## 3. Manually triggering a deploy

Two options:

**GitHub UI**

1. Go to the **Actions** tab.
2. Click **Deploy to production** in the left sidebar.
3. Click **Run workflow** → choose `main` → **Run workflow**.

**GitHub CLI**

```bash
gh workflow run "Deploy to production" --ref main
```

Useful when you need to re-deploy after fixing something on the server, or
when you've manually rolled the code back and want CI to rebuild and ship.

---

## 4. Rolling back

### Option A — revert and redeploy (preferred)

Fastest, leaves a clear git history:

```bash
git revert <bad-commit-sha>
git push origin main
```

The push triggers a fresh deploy of the reverted code.

If the bad commit was a merge, use `git revert -m 1 <merge-sha>`.

### Option B — reset and force-push (only if a revert is messier than it's worth)

```bash
git reset --hard <last-known-good-sha>
git push --force-with-lease origin main
```

`--force-with-lease` is safer than `--force` — it refuses to overwrite if
someone else has pushed in the meantime. Coordinate with the team first.

### Option C — manual file rollback (last resort)

If CI is broken and you need to get the site working *right now*, you can
restore the previous deploy on the server directly. Before this works, you
need to be making tarball backups before each deploy — add this as a step in
the workflow if you want it:

```yaml
# In the workflow, before rsync:
- name: Snapshot current server state
  run: |
    ssh -p "${{ secrets.SSH_PORT }}" "${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}" \
      "cd /home/credftus && tar czf creditco-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
         --exclude='creditco/storage' --exclude='creditco/.env' creditco/"
```

Then to roll back:

```bash
ssh credftus@<host>
cd /home/credftus
php /home/credftus/creditco/artisan down
tar xzf creditco-backup-<timestamp>.tar.gz
cd creditco
php artisan up
```

> This option is included for completeness. In practice, **Option A** is
> almost always the right answer — it keeps git as the source of truth.

---

## 5. Troubleshooting

**Workflow fails at "Pin server host key" or rsync step with host verification error**
- The `SSH_KNOWN_HOSTS` secret is stale (server reinstalled, port changed, etc.).
- Re-run `ssh-keyscan -p <port> -H <host>` and update the secret.

**Workflow fails at "Run post-deploy commands" with `migrate` errors**
- The migration is broken. Check the log, fix the migration, push again. The
  failed deploy left the site in maintenance mode — fix forward fast, or SSH
  in and run `php artisan up` to unblock users on the previous code.

**Site shows "Vite manifest not found" after deploy**
- `npm run build` didn't run, or `public/build/` was excluded from rsync.
- Confirm `public/build/` is not in `.rsyncignore` and check the CI log.

**`php artisan` commands fail with "Class not found"**
- Stale `bootstrap/cache/*.php`. SSH in and run:
  ```bash
  cd /home/credftus/creditco
  rm -f bootstrap/cache/*.php
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
  ```
