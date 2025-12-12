from django.urls import path
from .views import PendingBillsListAPIView, CreateInvoiceAPIView, MarkInvoicePaidAPIView, InvoiceRetrieveAPIView

urlpatterns = [
    path("pending/", PendingBillsListAPIView.as_view(), name="billing-pending"),
    path("invoices/", CreateInvoiceAPIView.as_view(), name="invoice-create"),
    path("invoices/<int:pk>/", InvoiceRetrieveAPIView.as_view(), name="invoice-detail"),
    path("invoices/<int:pk>/pay/", MarkInvoicePaidAPIView.as_view(), name="invoice-pay"),
]
