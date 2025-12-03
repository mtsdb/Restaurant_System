from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """Allow access only to users whose role.is_admin is True."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        role = getattr(user, "role", None)
        return bool(role and getattr(role, "is_admin", False))
