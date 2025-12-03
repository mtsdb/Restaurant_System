from rest_framework import serializers
from .models import User
from rbac_app.models import Role


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ("id", "name", "is_admin")


class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "role", "is_active")


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    role_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = User
        fields = ("id", "username", "password", "role_id", "is_active")

    def create(self, validated_data):
        password = validated_data.pop("password")
        role_id = validated_data.pop("role_id", None)
        role = None
        if role_id:
            try:
                role = Role.objects.get(id=role_id)
            except Role.DoesNotExist:
                raise serializers.ValidationError({"role_id": "Invalid role_id"})
        user = User(username=validated_data.get("username"), role=role, is_active=validated_data.get("is_active", True))
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    role_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = User
        fields = ("username", "password", "role_id", "is_active")

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        role_id = validated_data.pop("role_id", None)
        if role_id is not None:
            if role_id:
                try:
                    instance.role = Role.objects.get(id=role_id)
                except Role.DoesNotExist:
                    raise serializers.ValidationError({"role_id": "Invalid role_id"})
            else:
                instance.role = None
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
