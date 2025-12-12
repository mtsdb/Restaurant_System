from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from accounts_app.permissions import IsAdminRole
from .models import Category, Item
from .serializers import CategorySerializer, ItemSerializer


class CategoryListCreateAPIView(generics.ListCreateAPIView):
	queryset = Category.objects.all().order_by("name")
	serializer_class = CategorySerializer
	permission_classes = (IsAuthenticated,)

	def get_permissions(self):
		if self.request.method == "POST":
			return [IsAuthenticated(), IsAdminRole()]
		return [IsAuthenticated()]


class ItemListCreateAPIView(generics.ListCreateAPIView):
	# For GET, only show available items (menu listing for waiter)
	serializer_class = ItemSerializer
	permission_classes = (IsAuthenticated,)

	def get_queryset(self):
		# By default return available items; admin can pass ?all=1 to see everything
		user = self.request.user
		qs = Item.objects.all().select_related("category").order_by("name")
		if self.request.query_params.get("all") in ("1", "true", "True"):
			# only allow admins to view all
			if getattr(user, "is_superuser", False) or getattr(getattr(user, 'role', None), 'is_admin', False):
				return qs
			# fallthrough to available only
		return qs.filter(available=True)

	def get_permissions(self):
		# POST requires admin
		if self.request.method == "POST":
			return [IsAuthenticated(), IsAdminRole()]
		return [IsAuthenticated()]


class ItemRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
	queryset = Item.objects.all()
	serializer_class = ItemSerializer
	permission_classes = (IsAuthenticated,)

	def get_permissions(self):
		# PATCH and DELETE require admin
		if self.request.method in ("PATCH", "PUT", "DELETE"):
			return [IsAuthenticated(), IsAdminRole()]
		return [IsAuthenticated()]


class CategoryRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
	queryset = Category.objects.all()
	serializer_class = CategorySerializer
	permission_classes = (IsAuthenticated,)

	def get_permissions(self):
		# PATCH and DELETE require admin
		if self.request.method in ("PATCH", "PUT", "DELETE"):
			return [IsAuthenticated(), IsAdminRole()]
		return [IsAuthenticated()]

