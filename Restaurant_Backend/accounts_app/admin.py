from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import User
from rbac_app.models import Role


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
	list_display = ("id", "name", "is_admin")
	search_fields = ("name",)


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
	model = User
	list_display = ("id", "username", "role", "is_active")
	list_filter = ("is_active", "role")
	search_fields = ("username",)
	ordering = ("username",)
	fieldsets = (
		(None, {"fields": ("username", "password")}),
		("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "role")}),
	)
	add_fieldsets = (
		(None, {"classes": ("wide",), "fields": ("username", "password1", "password2", "role")}),
	)
