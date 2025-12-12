from django.core.management.base import BaseCommand
from django.db import transaction
from menu_app.models import Category, Item


class Command(BaseCommand):
    help = "Seed menu categories, items and create sample users with roles"

    def handle(self, *args, **options):
        from rbac_app.models import Role
        from accounts_app.models import User

        with transaction.atomic():
            # Create categories
            categories = [
                ("Starters", [
                    ("Bruschetta", "Toasted bread with tomatoes", "4.50"),
                    ("Garlic Bread", "Toasted garlic butter bread", "3.00"),
                    ("Stuffed Mushrooms", "Mushrooms with cheese filling", "5.50"),
                    ("Spring Rolls", "Crispy vegetable rolls", "4.00"),
                    ("Olives Bowl", "Marinated olives", "2.50"),
                ]),
                ("Mains", [
                    ("Grilled Chicken", "Herb grilled chicken with sides", "12.00"),
                    ("Spaghetti Bolognese", "Classic beef ragu", "10.50"),
                    ("Vegetable Curry", "Seasonal veg curry with rice", "9.00"),
                    ("Beef Steak", "Sirloin steak with pepper sauce", "15.00"),
                    ("Fish & Chips", "Beer-battered fish with fries", "11.00"),
                ]),
                ("Desserts", [
                    ("Cheesecake", "Creamy cheesecake", "5.00"),
                    ("Chocolate Brownie", "Warm brownie with ice cream", "4.50"),
                    ("Panna Cotta", "Vanilla panna cotta", "4.75"),
                    ("Fruit Salad", "Seasonal fruit mix", "3.50"),
                    ("Ice Cream Scoop", "Choice of flavors", "2.50"),
                ]),
            ]

            self.stdout.write("Seeding categories and items...")
            for cat_name, items in categories:
                cat_obj, _ = Category.objects.get_or_create(name=cat_name)
                for name, desc, price in items:
                    Item.objects.get_or_create(
                        category=cat_obj,
                        name=name,
                        defaults={
                            "description": desc,
                            "price": price,
                            "available": True,
                            "type": Item.TYPE_FOOD,
                        },
                    )

            # Drinks category with 5 drinks
            drinks = [
                ("Espresso", "Strong coffee shot", "2.00"),
                ("Cappuccino", "Espresso with steamed milk", "3.00"),
                ("Latte", "Milk-forward espresso drink", "3.25"),
                ("Orange Juice", "Freshly squeezed orange", "2.50"),
                ("Iced Tea", "Chilled brewed tea", "2.00"),
            ]

            drinks_cat, _ = Category.objects.get_or_create(name="Drinks")
            for name, desc, price in drinks:
                Item.objects.get_or_create(
                    category=drinks_cat,
                    name=name,
                    defaults={
                        "description": desc,
                        "price": price,
                        "available": True,
                        "type": Item.TYPE_DRINK,
                    },
                )

            self.stdout.write(self.style.SUCCESS("Menu seeded."))

            # Create roles if not present (ensure roles exist)
            role_names = ["cashier", "barista", "chef", "waiter", "admin"]
            role_objs = {}
            for rn in role_names:
                r, _ = Role.objects.get_or_create(name=rn, defaults={"description": f"Auto-created role {rn}"})
                role_objs[rn] = r

            # Create users: usernames correspond to role names
            users = [
                ("cashier", "cashier"),
                ("barista", "barista"),
                ("chef", "chef"),
                ("waiter", "waiter"),
                ("admin", "admin"),
            ]

            self.stdout.write("Seeding users...")
            for username, role_name in users:
                role = role_objs.get(role_name)
                if username == "admin":
                    # create superuser if not exists
                    if not User.objects.filter(username=username).exists():
                        User.objects.create_superuser(username=username, password="password123")
                        # ensure role is assigned
                        u = User.objects.get(username=username)
                        u.role = role
                        u.save()
                else:
                    if not User.objects.filter(username=username).exists():
                        User.objects.create_user(username=username, password="password123", role=role)

            self.stdout.write(self.style.SUCCESS("Users seeded (password: password123)."))
