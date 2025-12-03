from django.db import models
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.apps import apps


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, username, password=None, role=None, **extra_fields):
        if not username:
            raise ValueError("The given username must be set")
        username = self.model.normalize_username(username)
        user = self.model(username=username, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        # create a Role with is_admin True for superusers if not present
        Role = apps.get_model("rbac_app", "Role")
        role, _ = Role.objects.get_or_create(name="admin", defaults={"description": "admin role"})
        extra_fields.setdefault("is_active", True)
        user = self.create_user(username, password=password, role=role, **extra_fields)
        # Give Django-level permissions hints
        user.is_superuser = True
        user.is_staff = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model with a Role foreign key."""
    id = models.BigAutoField(primary_key=True)
    username = models.CharField(max_length=150, unique=True)
    # password field provided by AbstractBaseUser
    # reference Role from rbac_app to avoid duplicate definitions
    role = models.ForeignKey("rbac_app.Role", on_delete=models.PROTECT, null=True, blank=True, related_name="users")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.username

