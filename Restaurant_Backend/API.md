# Backend API Summary

This document summarizes the primary HTTP API endpoints implemented in the backend (Django + DRF) and their expected usage, permissions and behavior.

## Auth / Accounts

- POST /api/auth/token/  
	- Request: {"username": "...", "password": "..."}
	- Response: JWT access/refresh tokens (Simple JWT)
	- Purpose: obtain tokens for Authorization header "Bearer <token>"

- POST /api/auth/login/  
	- Custom login endpoint (project provides `LoginAPIView`) — returns user info and tokens.

- GET /api/auth/me/  
	- Returns current user details. Authenticated (JWT) required.

- Users management (admin):
	- GET /api/users/  (admin)
	- POST /api/users/ (admin)
	- PATCH /api/users/{id}/ (admin)
	- DELETE /api/users/{id}/ (admin)

Authorization: send Authorization: Bearer <access_token>

## RBAC (roles & permissions)

- GET /api/rbac/ (see `rbac_app.urls`) — Role and Permission serializers exist. Role editing is intended to be managed via Django Admin.

## Tables app

- GET /api/tables/  
	- List all tables. Authenticated users can view.

- POST /api/tables/  
	- Create a table (admin only).
	- Body: { "number": 1 }

- POST /api/tables/{id}/open-session/  
	- Open a TableSession for the given table (waiter or admin).
	- Creates a TableSession and sets the table status to `occupied`.

- POST /api/tables/{id}/close-session/  
	- Close the active session for the table (cashier or admin).
	- Marks session status `closed`, sets `ended_at`, and sets table status to `available`.

- GET /api/sessions/{id}/  
	- Retrieve a TableSession object and its metadata.

Notes: model-level validation prevents more than one active session per table; consider DB-level constraints or select_for_update for concurrency safety.

## Menu app

- GET /api/menu/categories/  
	- List categories (authenticated).

- POST /api/menu/categories/  
	- Create category (admin only). Body: {"name": "Main"}

- GET /api/menu/items/  
	- Menu listing for waiters. By default returns only available items. Admins can pass `?all=1` to view everything.

- POST /api/menu/items/  
	- Create menu item (admin only). Body example:
		{"category_id": 1, "name": "Cappuccino", "description": "...", "price": "3.50", "available": true, "type": "drink"}

- PATCH /api/menu/items/{id}/  
	- Update item (admin only).

- DELETE /api/menu/items/{id}/  
	- Delete item (admin only).

Model highlights: `Item.type` is `food` or `drink` — food items route to kitchen dashboard, drinks to barista dashboard.

## Orders app

- POST /api/sessions/{id}/orders/  
	- Create a new Order for an active TableSession (waiter role required).
	- Response includes order id and empty items array.

- GET /api/orders/{id}/  
	- Retrieve an order and its OrderItems.

- POST /api/orders/{id}/add-item/  
	- Add an OrderItem to the order (waiter role required).
	- Body: { "item_id": <menu_item_id>, "quantity": 2, "note_to_chef": "no salt" }
	- Behavior: records `price_snapshot` from menu item, enforce `available` check.

- PATCH /api/orders/items/{id}/status/  
	- Update an OrderItem's status (allowed for chef, waiter, or admin). Body: {"status": "in_progress"}
	- Valid statuses: waiting, in_progress, ready, served

- DELETE /api/orders/items/{id}/  
	- Delete an OrderItem (admin-only).

Notes: order items are routed for UI filtering by the linked `menu_app.Item.type` (food vs drink). `price_snapshot` preserves price at time of ordering.

## Admin / Django admin

- Django admin is enabled at /admin/ and registers Users, Roles/Permissions, Tables, TableSessions, Categories, Items, Orders and OrderItems.

## Conventions & Headers

- Authentication: JWT (Simple JWT) — include Authorization: Bearer <access_token>
- All endpoints expect/return JSON. Standard DRF responses and status codes used (200/201/204/400/403).
