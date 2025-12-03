# Backend Structure

This section outlines the backend architecture, models, and API endpoints for the Restaurant Ordering and Workflow Management System. The backend uses Django and Django REST Framework and is organized by domain focused apps.

---

## Accounts App
Handles authentication, authorization, and user role assignments.

### Models

#### User
- **id**
- **username**
- **password**
- **role** (ForeignKey to Role)
- **is_active**

**Relationships**
- Each user is assigned to one role.
- Users do not directly reference orders.
- Access is controlled through roles and their linked permissions.

### Endpoints
- `POST /api/auth/login/`
- `GET /api/auth/me/`
- `GET /api/users/` (admin)
- `POST /api/users/` (admin)
- `PATCH /api/users/{id}/` (admin)
- `DELETE /api/users/{id}/` (admin)

---

## RBAC App
Manages role based access control. Only Django Admin can create or modify roles and permissions.

### Models

#### Role
- **id**
- **name**
- **description**

**Relationships**
- One role can have many permissions.
- Many to many relationship with Permission.
- A role can be assigned to many users.

#### Permission
- **id**
- **name**
- **code**

**Relationships**
- One permission can belong to many roles.

---

## Tables App
Manages physical table information and active customer sessions.

### Models

#### Table
- **number**
- **status** (available, occupied)

#### TableSession
- **table** (FK to Table)
- **started_at**
- **ended_at**
- **status** (active, closed)

**Relationships**
- One table can have multiple sessions.
- Only one active session is allowed at a time.

### Endpoints
- `GET /api/tables/`
- `POST /api/tables/` (admin)
- `POST /api/tables/{id}/open-session/` (waiter)
- `POST /api/tables/{id}/close-session/` (cashier or admin)
- `GET /api/sessions/{id}/`

---

## Menu App
Stores menu categories and items.

### Models

#### Category
- **name**

#### Item
- **category** (FK)
- **name**
- **description**
- **price**
- **available** (boolean)
- **type** (food or drink)

**Relationships**
- Each category holds many items.
- Food items appear in the kitchen.
- Drink items appear in the barista dashboard.

### Endpoints
- `GET /api/menu/categories/`
- `POST /api/menu/categories/` (admin)
- `GET /api/menu/items/`
- `POST /api/menu/items/` (admin)
- `PATCH /api/menu/items/{id}/` (admin)
- `DELETE /api/menu/items/{id}/` (admin)

---

## Orders App
Handles all order creation and modification.

### Models

#### Order
- **session** (FK to TableSession)
- **created_by** (FK to User)
- **created_at**

#### OrderItem
- **order** (FK)
- **item** (FK to Menu Item)
- **quantity**
- **note_to_chef**
- **price_snapshot**
- **status** (waiting, in_progress, ready, served)

**Relationships**
- One order contains many items.
- Each order must belong to the session that is currently active for the table.
- Food items are routed to the kitchen. Drink items are routed to the barista dashboard.

### Endpoints
- `POST /api/sessions/{id}/orders/` (waiter)
- `GET /api/orders/{id}/`
- `POST /api/orders/{id}/add-item/` (waiter)
- `PATCH /api/orders/items/{id}/status/` (waiter or chef)
- `DELETE /api/orders/items/{id}/` (admin)

---

## Kitchen App
Provides tools for chefs to manage incoming food preparation tasks.

### Endpoints
- `GET /api/kitchen/items/?status=waiting` (chef)
- `PATCH /api/kitchen/items/{id}/` (chef)

This app filters OrderItems that relate to food items so chefs can update status.

---

## Barista App
Handles drink preparation workflow for baristas.

### Endpoints
- `GET /api/barista/items/?status=waiting` (barista)
- `PATCH /api/barista/items/{id}/` (barista)

---

## Billing App
Manages invoice creation, totals, payment processing, and table closure.

### Models

#### Invoice
- **session** (FK)
- **subtotal**
- **service_charge**
- **tax**
- **total**
- **paid** (boolean)

**Relationships**
- Each table session produces one invoice.
- Totals are computed from all OrderItems associated with the session.

### Endpoints
- `POST /api/sessions/{id}/request-bill/` (waiter)
- `GET /api/billing/pending/` (cashier)
- `POST /api/billing/invoices/` (cashier)
- `PATCH /api/billing/invoices/{id}/pay/` (cashier)

---

## Settings App
Stores configuration values that affect billing calculations.

### Models

#### Setting
- **id**
- **tax_rate**
- **service_charge_rate**
- **discount options**

**Relationships**
- Billing logic reads these values when calculating invoice totals.

### Endpoints
- `GET /api/settings/`
- `PATCH /api/settings/{id}/` (admin)
- `POST /api/settings/` (admin)

---

## Summary
This backend structure supports a modular, scalable, and flexible restaurant management system. Each app is responsible for a focused part of the workflow and exposes clean and structured API endpoints. This layout makes future expansion easier, including real time updates, QR based ordering, analytics, and operational automation.
