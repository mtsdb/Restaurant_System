from decimal import Decimal, ROUND_HALF_UP
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone

from accounts_app.permissions import IsAdminRole
from settings_app.models import Setting
from tables_app.models import TableSession
from orders_app.models import OrderItem
from .models import Invoice
from .serializers import InvoiceSerializer


def _user_has_role(user, role_name):
    if not user or not user.is_authenticated:
        return False
    if getattr(user, "is_superuser", False):
        return True
    role = getattr(user, "role", None)
    return bool(role and getattr(role, "name", "").lower() == role_name.lower())


def _quantize(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _get_settings():
    obj = Setting.objects.first()
    if not obj:
        obj = Setting.objects.create()
    return obj


def _compute_totals_for_session(session: TableSession):
    items = OrderItem.objects.filter(order__session=session)
    subtotal = Decimal("0.00")
    for it in items:
        subtotal += (Decimal(it.price_snapshot) * it.quantity)
    subtotal = _quantize(subtotal)

    s = _get_settings()
    # rates are provided as percentages, e.g., 10.00 means 10%
    discount = _quantize(subtotal * (Decimal(s.discount_rate) / Decimal("100")))
    after_discount = subtotal - discount
    service_charge = _quantize(after_discount * (Decimal(s.service_charge_rate) / Decimal("100")))
    tax_base = after_discount + service_charge
    tax = _quantize(tax_base * (Decimal(s.tax_rate) / Decimal("100")))
    total = _quantize(after_discount + service_charge + tax)
    return {
        "subtotal": subtotal,
        "discount": discount,
        "service_charge": service_charge,
        "tax": tax,
        "total": total,
    }


class PendingBillsListAPIView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        # Only cashier or admin can view pending
        if not _user_has_role(request.user, "cashier") and not getattr(request.user, "is_superuser", False) and not getattr(getattr(request.user, 'role', None), 'is_admin', False):
            return Response({"detail": "You do not have permission to view pending bills."}, status=status.HTTP_403_FORBIDDEN)

        sessions = TableSession.objects.filter(status=TableSession.STATUS_ACTIVE, bill_requested=True).select_related("table")
        data = []
        for s in sessions:
            inv = getattr(s, "invoice", None)
            if inv and inv.paid:
                continue
            data.append({
                "session": s.id,
                "table": s.table.number,
                "bill_requested_at": s.bill_requested_at,
                "has_invoice": bool(inv),
                "invoice_id": getattr(inv, "id", None),
            })
        return Response(data, status=status.HTTP_200_OK)


class CreateInvoiceAPIView(generics.CreateAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        if not _user_has_role(request.user, "cashier") and not getattr(request.user, "is_superuser", False) and not getattr(getattr(request.user, 'role', None), 'is_admin', False):
            return Response({"detail": "You do not have permission to create invoices."}, status=status.HTTP_403_FORBIDDEN)

        session_id = request.data.get("session_id")
        if not session_id:
            return Response({"detail": "session_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        session = get_object_or_404(TableSession, pk=session_id)

        if getattr(session, "invoice", None):
            return Response({"detail": "Invoice already exists for this session."}, status=status.HTTP_400_BAD_REQUEST)

        totals = _compute_totals_for_session(session)
        invoice = Invoice(
            session=session,
            subtotal=totals["subtotal"],
            discount=totals["discount"],
            service_charge=totals["service_charge"],
            tax=totals["tax"],
            total=totals["total"],
        )
        invoice.save()
        serializer = InvoiceSerializer(invoice)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MarkInvoicePaidAPIView(generics.UpdateAPIView):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = (IsAuthenticated,)

    def patch(self, request, pk):
        if not _user_has_role(request.user, "cashier") and not getattr(request.user, "is_superuser", False) and not getattr(getattr(request.user, 'role', None), 'is_admin', False):
            return Response({"detail": "You do not have permission to mark invoice paid."}, status=status.HTTP_403_FORBIDDEN)
        invoice = get_object_or_404(Invoice, pk=pk)
        if invoice.paid:
            return Response({"detail": "Invoice is already paid."}, status=status.HTTP_400_BAD_REQUEST)
        invoice.paid = True
        invoice.paid_at = timezone.now()
        invoice.save()
        serializer = InvoiceSerializer(invoice)
        return Response(serializer.data, status=status.HTTP_200_OK)


class InvoiceRetrieveAPIView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, pk):
        # Only cashier or admin can view invoice details
        if not _user_has_role(request.user, "cashier") and not getattr(request.user, "is_superuser", False) and not getattr(getattr(request.user, 'role', None), 'is_admin', False):
            return Response({"detail": "You do not have permission to view invoices."}, status=status.HTTP_403_FORBIDDEN)

        invoice = get_object_or_404(Invoice, pk=pk)
        session = invoice.session
        # Collect items for the whole session
        qs = OrderItem.objects.filter(order__session=session).select_related("item", "order__created_by")
        items = []
        waiter_names_set = set()
        for it in qs:
            waiter = getattr(getattr(it.order, "created_by", None), "get_full_name", None)
            waiter_name = None
            if callable(waiter):
                waiter_name = waiter() or None
            if not waiter_name:
                waiter_name = getattr(getattr(it.order, "created_by", None), "username", None)
            if waiter_name:
                waiter_names_set.add(waiter_name)
            items.append({
                "id": it.id,
                "name": getattr(getattr(it, "item", None), "name", None),
                "quantity": it.quantity,
                "unit_price": str(it.price_snapshot),
                "line_total": str(it.price_snapshot * it.quantity),
                "status": it.status,
            })

        serializer = InvoiceSerializer(invoice)
        data = serializer.data
        data.update({
            "session": session.id,
            "table": getattr(getattr(session, "table", None), "number", None),
            "items": items,
            "waiters": sorted(waiter_names_set),
        })
        return Response(data, status=status.HTTP_200_OK)
