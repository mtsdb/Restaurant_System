from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

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
		# Only chef or waiter (or admin) can update statuses
		if not (_user_has_role(request.user, "chef") or _user_has_role(request.user, "waiter") or getattr(request.user, "is_superuser", False) or getattr(getattr(request.user, 'role', None), 'is_admin', False)):
			return Response({"detail": "You do not have permission to update item status."}, status=status.HTTP_403_FORBIDDEN)

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
