from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.shortcuts import get_object_or_404

from accounts_app.permissions import IsAdminRole
from .models import Table, TableSession
from .serializers import TableSerializer, TableSessionSerializer


def _user_has_role(user, role_name):
	if not user or not user.is_authenticated:
		return False
	if getattr(user, "is_superuser", False):
		return True
	role = getattr(user, "role", None)
	return bool(role and getattr(role, "name", "").lower() == role_name.lower())


class TableListCreateAPIView(generics.ListCreateAPIView):
	queryset = Table.objects.all().order_by("number")
	serializer_class = TableSerializer
	permission_classes = (IsAuthenticated,)

	def get_permissions(self):
		# For create, require admin role
		if self.request.method == "POST":
			return [IsAuthenticated(), IsAdminRole()]
		return [IsAuthenticated()]


class OpenSessionAPIView(generics.GenericAPIView):
	permission_classes = (IsAuthenticated,)

	def post(self, request, pk):
		# Only waiters (or admin/superuser) can open sessions
		if not _user_has_role(request.user, "waiter") and not getattr(request.user, "is_superuser", False) and not getattr(getattr(request.user, 'role', None), 'is_admin', False):
			return Response({"detail": "You do not have permission to open a session."}, status=status.HTTP_403_FORBIDDEN)

		table = get_object_or_404(Table, pk=pk)
		if table.status == Table.STATUS_OCCUPIED:
			return Response({"detail": "Table is already occupied."}, status=status.HTTP_400_BAD_REQUEST)

		# create session
		session = TableSession(table=table)
		try:
			session.save()
		except Exception as e:
			return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

		table.status = Table.STATUS_OCCUPIED
		table.save()

		serializer = TableSessionSerializer(session)
		return Response(serializer.data, status=status.HTTP_201_CREATED)


class CloseSessionAPIView(generics.GenericAPIView):
	permission_classes = (IsAuthenticated,)

	def post(self, request, pk):
		# Only cashier or admin can close sessions
		if not _user_has_role(request.user, "cashier") and not getattr(request.user, "is_superuser", False) and not getattr(getattr(request.user, 'role', None), 'is_admin', False):
			return Response({"detail": "You do not have permission to close a session."}, status=status.HTTP_403_FORBIDDEN)

		table = get_object_or_404(Table, pk=pk)
		# find active session
		try:
			session = table.sessions.get(status=TableSession.STATUS_ACTIVE)
		except TableSession.DoesNotExist:
			return Response({"detail": "No active session for this table."}, status=status.HTTP_400_BAD_REQUEST)

		session.close()
		table.status = Table.STATUS_AVAILABLE
		table.save()

		serializer = TableSessionSerializer(session)
		return Response(serializer.data, status=status.HTTP_200_OK)


class SessionRetrieveAPIView(generics.RetrieveAPIView):
	queryset = TableSession.objects.all()
	serializer_class = TableSessionSerializer
	permission_classes = (IsAuthenticated,)
