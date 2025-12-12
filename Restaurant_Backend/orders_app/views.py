from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Count

from accounts_app.permissions import IsAdminRole
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderItemSerializer
from tables_app.models import TableSession
from menu_app.models import Item as MenuItem


def _user_has_role(user, role_name):
	if not user or not user.is_authenticated:
		return False
	if getattr(user, "is_superuser", False):
		return True
	role = getattr(user, "role", None)
	return bool(role and getattr(role, "name", "").lower() == role_name.lower())


class CreateOrderForSessionAPIView(generics.CreateAPIView):
	serializer_class = OrderSerializer
	permission_classes = (IsAuthenticated,)

	def post(self, request, pk):
		# Only waiters (or admin) can create orders for a session
		if not _user_has_role(request.user, "waiter") and not getattr(request.user, "is_superuser", False) and not getattr(getattr(request.user, 'role', None), 'is_admin', False):
			return Response({"detail": "You do not have permission to create orders."}, status=status.HTTP_403_FORBIDDEN)

		session = get_object_or_404(TableSession, pk=pk)
		if session.status != TableSession.STATUS_ACTIVE:
			return Response({"detail": "Session is not active."}, status=status.HTTP_400_BAD_REQUEST)

		order = Order(session=session, created_by=request.user)
		order.save()
		serializer = OrderSerializer(order)
		return Response(serializer.data, status=status.HTTP_201_CREATED)


class OrderRetrieveAPIView(generics.RetrieveAPIView):
	queryset = Order.objects.all()
	serializer_class = OrderSerializer
	permission_classes = (IsAuthenticated,)


class AddItemToOrderAPIView(generics.CreateAPIView):
	serializer_class = OrderItemSerializer
	permission_classes = (IsAuthenticated,)

	def post(self, request, pk):
		# pk is order id
		order = get_object_or_404(Order, pk=pk)

		# Only waiter or admin can add items
		if not _user_has_role(request.user, "waiter") and not getattr(request.user, "is_superuser", False) and not getattr(getattr(request.user, 'role', None), 'is_admin', False):
			return Response({"detail": "You do not have permission to add items."}, status=status.HTTP_403_FORBIDDEN)

		item_id = request.data.get("item_id")
		quantity = int(request.data.get("quantity", 1))
		note = request.data.get("note_to_chef", "")

		menu_item = get_object_or_404(MenuItem, pk=item_id)
		if not menu_item.available:
			return Response({"detail": "Item is not available."}, status=status.HTTP_400_BAD_REQUEST)

		order_item = OrderItem(
			order=order,
			item=menu_item,
			quantity=quantity,
			note_to_chef=note,
			price_snapshot=menu_item.price,
		)
		order_item.save()

		serializer = OrderItemSerializer(order_item)
		return Response(serializer.data, status=status.HTTP_201_CREATED)


class OrderItemStatusUpdateAPIView(generics.UpdateAPIView):
	queryset = OrderItem.objects.all()
	serializer_class = OrderItemSerializer
	permission_classes = (IsAuthenticated,)
	http_method_names = ["patch"]

	def patch(self, request, pk):
		order_item = get_object_or_404(OrderItem, pk=pk)
		# Only chef, barista, waiter, or admin can update statuses
		if not (_user_has_role(request.user, "chef") or _user_has_role(request.user, "barista") or _user_has_role(request.user, "waiter") or getattr(request.user, "is_superuser", False) or getattr(getattr(request.user, 'role', None), 'is_admin', False)):
			return Response({"detail": "You do not have permission to update item status."}, status=status.HTTP_403_FORBIDDEN)

		# Role-based domain restriction
		item_type = order_item.item.type
		if _user_has_role(request.user, "chef") and item_type != MenuItem.TYPE_FOOD:
			return Response({"detail": "Chefs can only update food items."}, status=status.HTTP_403_FORBIDDEN)
		if _user_has_role(request.user, "barista") and item_type != MenuItem.TYPE_DRINK:
			return Response({"detail": "Baristas can only update drink items."}, status=status.HTTP_403_FORBIDDEN)

		status_value = request.data.get("status")
		if status_value not in dict(OrderItem.STATUS_CHOICES):
			return Response({"detail": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)

		order_item.status = status_value
		order_item.save()
		serializer = OrderItemSerializer(order_item)
		return Response(serializer.data, status=status.HTTP_200_OK)


class OrderItemDeleteAPIView(generics.DestroyAPIView):
	queryset = OrderItem.objects.all()
	permission_classes = (IsAuthenticated,)

	def delete(self, request, pk):
		# admin only
		if not getattr(request.user, "is_superuser", False) and not getattr(getattr(request.user, 'role', None), 'is_admin', False):
			return Response({"detail": "You do not have permission to delete order items."}, status=status.HTTP_403_FORBIDDEN)

		order_item = get_object_or_404(OrderItem, pk=pk)
		order_item.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)


class KitchenOrderItemListAPIView(generics.ListAPIView):
	serializer_class = OrderItemSerializer
	permission_classes = (IsAuthenticated,)

	def get(self, request):
		# Allow chef, waiter, or admin to view kitchen items
		if not (_user_has_role(request.user, "chef") or _user_has_role(request.user, "waiter") or getattr(request.user, "is_superuser", False) or getattr(getattr(request.user, 'role', None), 'is_admin', False)):
			return Response({"detail": "You do not have permission to view kitchen items."}, status=status.HTTP_403_FORBIDDEN)

		qs = OrderItem.objects.select_related("order", "item", "order__session", "order__session__table").filter(
			item__type=MenuItem.TYPE_FOOD
		)

		# Filters
		status_param = request.query_params.get("status")
		if status_param:
			allowed_statuses = set(dict(OrderItem.STATUS_CHOICES).keys())
			requested = {s.strip() for s in status_param.split(",") if s.strip()}
			valid = list(requested & allowed_statuses)
			if valid:
				qs = qs.filter(status__in=valid)

		table_param = request.query_params.get("table")
		if table_param:
			try:
				qs = qs.filter(order__session__table__number=int(table_param))
			except ValueError:
				pass

		session_param = request.query_params.get("session")
		if session_param:
			try:
				qs = qs.filter(order__session_id=int(session_param))
			except ValueError:
				pass

		qs = qs.order_by("created_at")
		serializer = OrderItemSerializer(qs, many=True)
		return Response(serializer.data, status=status.HTTP_200_OK)


class KitchenDashboardAPIView(APIView):
	permission_classes = (IsAuthenticated,)

	def get(self, request):
		# Allow chef, waiter, or admin to view dashboard
		if not (_user_has_role(request.user, "chef") or _user_has_role(request.user, "waiter") or getattr(request.user, "is_superuser", False) or getattr(getattr(request.user, 'role', None), 'is_admin', False)):
			return Response({"detail": "You do not have permission to view the kitchen dashboard."}, status=status.HTTP_403_FORBIDDEN)

		base_qs = OrderItem.objects.filter(item__type=MenuItem.TYPE_FOOD)

		# Optional status filter (same as list endpoint) to scope dashboard
		status_param = request.query_params.get("status")
		if status_param:
			allowed_statuses = set(dict(OrderItem.STATUS_CHOICES).keys())
			requested = {s.strip() for s in status_param.split(",") if s.strip()}
			valid = list(requested & allowed_statuses)
			if valid:
				base_qs = base_qs.filter(status__in=valid)

		counts = {OrderItem.STATUS_WAITING: 0, OrderItem.STATUS_IN_PROGRESS: 0, OrderItem.STATUS_READY: 0}
		for row in base_qs.values("status").annotate(c=Count("id")):
			s = row["status"]
			if s in counts:
				counts[s] = row["c"]

		data = {
			"food": {
				"waiting": counts[OrderItem.STATUS_WAITING],
				"in_progress": counts[OrderItem.STATUS_IN_PROGRESS],
				"ready": counts[OrderItem.STATUS_READY],
				"total_pending": counts[OrderItem.STATUS_WAITING] + counts[OrderItem.STATUS_IN_PROGRESS],
			},
			"updated_at": timezone.now(),
		}
		return Response(data, status=status.HTTP_200_OK)


class BaristaOrderItemListAPIView(generics.ListAPIView):
	serializer_class = OrderItemSerializer
	permission_classes = (IsAuthenticated,)

	def get(self, request):
		# Allow barista, waiter, or admin to view barista items
		if not (_user_has_role(request.user, "barista") or _user_has_role(request.user, "waiter") or getattr(request.user, "is_superuser", False) or getattr(getattr(request.user, 'role', None), 'is_admin', False)):
			return Response({"detail": "You do not have permission to view barista items."}, status=status.HTTP_403_FORBIDDEN)

		qs = OrderItem.objects.select_related("order", "item", "order__session", "order__session__table").filter(
			item__type=MenuItem.TYPE_DRINK
		)

		# Filters
		status_param = request.query_params.get("status")
		if status_param:
			allowed_statuses = set(dict(OrderItem.STATUS_CHOICES).keys())
			requested = {s.strip() for s in status_param.split(",") if s.strip()}
			valid = list(requested & allowed_statuses)
			if valid:
				qs = qs.filter(status__in=valid)

		table_param = request.query_params.get("table")
		if table_param:
			try:
				qs = qs.filter(order__session__table__number=int(table_param))
			except ValueError:
				pass

		session_param = request.query_params.get("session")
		if session_param:
			try:
				qs = qs.filter(order__session_id=int(session_param))
			except ValueError:
				pass

		qs = qs.order_by("created_at")
		serializer = OrderItemSerializer(qs, many=True)
		return Response(serializer.data, status=status.HTTP_200_OK)


class BaristaDashboardAPIView(APIView):
	permission_classes = (IsAuthenticated,)

	def get(self, request):
		# Allow barista, waiter, or admin to view dashboard
		if not (_user_has_role(request.user, "barista") or _user_has_role(request.user, "waiter") or getattr(request.user, "is_superuser", False) or getattr(getattr(request.user, 'role', None), 'is_admin', False)):
			return Response({"detail": "You do not have permission to view the barista dashboard."}, status=status.HTTP_403_FORBIDDEN)

		base_qs = OrderItem.objects.filter(item__type=MenuItem.TYPE_DRINK)

		# Optional status filter (same as list endpoint) to scope dashboard
		status_param = request.query_params.get("status")
		if status_param:
			allowed_statuses = set(dict(OrderItem.STATUS_CHOICES).keys())
			requested = {s.strip() for s in status_param.split(",") if s.strip()}
			valid = list(requested & allowed_statuses)
			if valid:
				base_qs = base_qs.filter(status__in=valid)

		counts = {OrderItem.STATUS_WAITING: 0, OrderItem.STATUS_IN_PROGRESS: 0, OrderItem.STATUS_READY: 0}
		for row in base_qs.values("status").annotate(c=Count("id")):
			s = row["status"]
			if s in counts:
				counts[s] = row["c"]

		data = {
			"drink": {
				"waiting": counts[OrderItem.STATUS_WAITING],
				"in_progress": counts[OrderItem.STATUS_IN_PROGRESS],
				"ready": counts[OrderItem.STATUS_READY],
				"total_pending": counts[OrderItem.STATUS_WAITING] + counts[OrderItem.STATUS_IN_PROGRESS],
			},
			"updated_at": timezone.now(),
		}
		return Response(data, status=status.HTTP_200_OK)
