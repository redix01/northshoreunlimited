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

The sweep runs from the Laravel scheduler, which needs one cron entry on the
server — without it the banked balance lags (displayed figures stay correct):

```
* * * * * cd /path/to/app && php artisan schedule:run >> /dev/null 2>&1
```
