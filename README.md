# Restaurant Ordering and Workflow Management System

## Introduction
The Restaurant Ordering and Workflow Management System is a full stack application that streamlines daily operations inside a restaurant. It handles customer ordering, waiter tasks, kitchen workflows, and cashier billing inside a unified and real time environment. The system supports both traditional waiter assisted service and future expansion into customer self ordering through QR based menus.

## Purpose
This system is designed to digitize and optimize the entire restaurant flow by improving communication, reducing errors, and increasing overall service quality. It aims to:
- Reduce delays between waiters and kitchen staff.
- Organize kitchen and bar preparation tasks more efficiently.
- Prevent billing mistakes through a structured checkout process.
- Improve customer experience through optional self service ordering that will arrive in a later version.
- Allow administrators to configure and control restaurant operations.

## Key Features

### Multi Role Access Controls
Each user type has its own interface and responsibilities.

- **Customer**: View menu, place orders, track status, and request assistance through a QR menu (arriving in version 2).
- **Waiter**: Create orders, add items, monitor kitchen progress, mark dishes as served, and start billing.
- **Chef**: View incoming food items, update cooking progress, and notify waiters when dishes are ready.
- **Barista**: Handle drink orders and update drink preparation status.
- **Cashier**: Generate invoices, apply taxes or service charges, accept payments, and close sessions.
- **Admin**: Manage menu, items, tables, users, configuration options, and feature controls.

### Customer Self Ordering via QR Code (Version 2)
A unique QR code will be assigned to each table. Customers will be able to:
- Browse the menu.
- Add items to a cart.
- Place orders without creating an account.

Admins can enable or disable this module depending on the restaurant’s needs.

### Real Time Kitchen Workflow
Orders submitted by waiters appear instantly inside the kitchen dashboard. Each item moves through clear stages:
- Waiting
- In Progress
- Ready for Pickup

### Table and Session Management
Every table maintains its own active session, which includes:
- Current orders
- Running bill
- Status indicators such as occupied, available, or bill requested

After payment, the table resets automatically for the next customer.

### Billing and Payment Processing
Cashiers can view all tables that have requested a bill. They can:
- Generate itemized invoices
- Apply taxes or service charges
- Finalize payments
- Close the table session  
PDF invoice exporting will be supported on the frontend.

### Menu and Inventory Management for Admins
Admins can manage:
- Menu categories
- Items, descriptions, and pricing
- Availability and item images
- Taxes and service charges
- Discounts
- User accounts and roles
- Analytics dashboard for management oversight

### Feature Toggle System
Admins can turn specific modules on or off, such as:
- Customer self ordering
- Real time notifications
- Automatic service charges

This provides flexibility for different restaurant workflows.

## Technical Architecture

### Backend
- **Framework**: Django and Django REST Framework  
- **Real Time Layer**: Django Channels (WebSockets)  
- **Background Tasks**: Celery with Redis  
- **Database**: SQLite for development, PostgreSQL for production  

### Core Backend Modules
- User and Role Management  
- Table Management  
- Menu and Categories  
- Order and Order Items  
- Kitchen Display System  
- Billing System  
- Notification System  
- Feature Toggle System  

### Frontend (Not part of the official capstone scope)
Although this project focuses on backend development, the frontend will be built using:
- **React**
- **Vite**

This will allow full end to end testing and a smoother development experience.

## Roadmap
- Version 1: Complete backend with waiter driven operations, kitchen dashboards, cashier billing, and admin management.
- Version 2: Customer self ordering module with QR code menu and expanded dashboard tools.

## Conclusion
This system aims to provide a complete digital workflow for restaurants. It centralizes operations, improves efficiency, and prepares the platform for advanced customer facing features in future versions.