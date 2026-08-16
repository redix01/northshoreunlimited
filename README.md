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
