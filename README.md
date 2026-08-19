# Northshore Unlimited Capital

Laravel 12 + Inertia + React migration of the existing front pages.

## What changed

- The original React front pages now render through Inertia.
- The home page form posts to Laravel at `POST /trade-request`.
- Requests are stored in the `trade_requests` table.

## Local development

1. Install PHP dependencies: `composer install`
2. Install Node dependencies: `npm install`
3. Run the app: `php artisan serve`
4. Run Vite: `npm run dev:vite`

If you want both processes together, use `npm run dev`.

## Balance accrual

Client balances grow at the percentage an admin sets, as a function of elapsed
time — not of anyone being logged in. At any instant a client has earned
`balance × rate × days since their last settlement`:

- **Screens** add that unsettled amount on the fly, so a dashboard opened after
  a week away already reads the right figure with no write on page load.
- **`balance:topup`** folds it into the stored balance and writes one earnings
  row. It credits exactly the period since the last settlement, so a missed run
  is caught up by the next one and a repeated run credits nothing.
- **Withdrawals and admin adjustments** settle first, so what a client can spend
  matches what they were shown.

A single catch-up is capped at 30 days (`TopupService::MAX_CATCHUP_DAYS`).

### The cron entry

The sweep runs from the Laravel scheduler, which needs one cron entry on the
server — without it the banked balance lags (displayed figures stay correct).
On the cPanel host, add this under Cron Jobs set to **every minute**:

```
/usr/local/bin/php /home/norttbfl/public_html/artisan schedule:run >> /dev/null 2>&1
```

One entry covers everything scheduled in `routes/console.php`: the top-up
sweep, the nightly portfolio snapshot, and the queue worker.

If the host will not allow a per-minute cron, settlement is self-healing, so a
coarser schedule still pays out the full amount — it just banks it later. A
single daily job works on its own:

```
5 0 * * * /usr/local/bin/php /home/norttbfl/public_html/artisan balance:topup >> /dev/null 2>&1
```

Two things to check the first time:

- `artisan` must be at that path — `ls /home/norttbfl/public_html/artisan`. If
  the app root sits above the web root, point the cron at the app root instead
  (for example `/home/norttbfl/laravel/artisan`).
- The CLI PHP must be 8.2+. `/usr/local/bin/php -v` says which one it is; on
  cPanel the versioned binaries (`/usr/local/bin/ea-php82`) are the reliable
  choice when the default is older.

To confirm it is working, run the command by hand over SSH — it prints how many
clients it credited — or watch a client's **Last credited** timestamp on their
admin page.

## Deploying

Laravel caches its route table, config and views. If a new route 404s or comes
back as `MethodNotAllowedHttpException` on the server while it works locally,
the cached table is stale — pull, then clear it:

```
cd /home/norttbfl/public_html
git pull
/usr/local/bin/php artisan migrate --force
/usr/local/bin/php artisan optimize:clear
```

`optimize:clear` drops the route, config, view and event caches in one go. Run
`npm run build` locally and commit `public/build` (it is tracked), so the server
never needs Node.
