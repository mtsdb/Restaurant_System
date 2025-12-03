from django.core.management.base import BaseCommand
from rbac_app.models import Role, Permission
from django.db import transaction

class Command(BaseCommand):
    help = 'Seeds initial permissions and roles for the restaurant system.'

    def handle(self, *args, **options):
        with transaction.atomic():
            # Define permissions
            permissions = [
                # Accounts
                {'name': 'Login', 'code': 'auth_login'},
                {'name': 'View own profile', 'code': 'auth_me'},
                {'name': 'View users', 'code': 'users_view'},
                {'name': 'Create user', 'code': 'users_create'},
                {'name': 'Update user', 'code': 'users_update'},
                {'name': 'Delete user', 'code': 'users_delete'},
                # Tables
                {'name': 'View tables', 'code': 'tables_view'},
                {'name': 'Create table', 'code': 'tables_create'},
                {'name': 'Open table session', 'code': 'tables_open_session'},
                {'name': 'Close table session', 'code': 'tables_close_session'},
                {'name': 'View session', 'code': 'sessions_view'},
                # Menu
                {'name': 'View menu categories', 'code': 'menu_categories_view'},
                {'name': 'Create menu category', 'code': 'menu_categories_create'},
                {'name': 'View menu items', 'code': 'menu_items_view'},
                {'name': 'Create menu item', 'code': 'menu_items_create'},
                {'name': 'Update menu item', 'code': 'menu_items_update'},
                {'name': 'Delete menu item', 'code': 'menu_items_delete'},
                # Orders
                {'name': 'Create order', 'code': 'orders_create'},
                {'name': 'View order', 'code': 'orders_view'},
                {'name': 'Add order item', 'code': 'orders_add_item'},
                {'name': 'Update order item status', 'code': 'orders_update_item_status'},
                {'name': 'Delete order item', 'code': 'orders_delete_item'},
                # Kitchen
                {'name': 'View kitchen items', 'code': 'kitchen_items_view'},
                {'name': 'Update kitchen item', 'code': 'kitchen_items_update'},
                # Barista
                {'name': 'View barista items', 'code': 'barista_items_view'},
                {'name': 'Update barista item', 'code': 'barista_items_update'},
                # Billing
                {'name': 'Request bill', 'code': 'billing_request_bill'},
                {'name': 'View pending bills', 'code': 'billing_pending_view'},
                {'name': 'Create invoice', 'code': 'billing_invoice_create'},
                {'name': 'Pay invoice', 'code': 'billing_invoice_pay'},
                # Settings
                {'name': 'View settings', 'code': 'settings_view'},
                {'name': 'Update settings', 'code': 'settings_update'},
                {'name': 'Create settings', 'code': 'settings_create'},
            ]

            # Create permissions
            permission_objs = {}
            for perm in permissions:
                obj, _ = Permission.objects.get_or_create(code=perm['code'], defaults={'name': perm['name']})
                permission_objs[perm['code']] = obj

            # Define roles and their permissions
            roles = [
                {
                    'name': 'admin',
                    'description': 'Administrator with full access',
                    'permissions': [p['code'] for p in permissions],
                },
                {
                    'name': 'waiter',
                    'description': 'Waiter with table and order access',
                    'permissions': [
                        'auth_login', 'auth_me',
                        'tables_view', 'tables_open_session',
                        'sessions_view',
                        'orders_create', 'orders_view', 'orders_add_item', 'orders_update_item_status',
                        'billing_request_bill',
                    ],
                },
                {
                    'name': 'chef',
                    'description': 'Chef with kitchen dashboard access',
                    'permissions': [
                        'auth_login', 'auth_me',
                        'kitchen_items_view', 'kitchen_items_update',
                        'orders_update_item_status',
                    ],
                },
                {
                    'name': 'barista',
                    'description': 'Barista with drink dashboard access',
                    'permissions': [
                        'auth_login', 'auth_me',
                        'barista_items_view', 'barista_items_update',
                        'orders_update_item_status',
                    ],
                },
                {
                    'name': 'cashier',
                    'description': 'Cashier with billing access',
                    'permissions': [
                        'auth_login', 'auth_me',
                        'tables_close_session',
                        'billing_pending_view', 'billing_invoice_create', 'billing_invoice_pay',
                    ],
                },
            ]

            # Create roles and assign permissions
            for role in roles:
                role_obj, _ = Role.objects.get_or_create(name=role['name'], defaults={'description': role['description']})
                perms = [permission_objs[code] for code in role['permissions'] if code in permission_objs]
                role_obj.permissions.set(perms)
                role_obj.save()

            self.stdout.write(self.style.SUCCESS('Permissions and roles seeded successfully.'))
