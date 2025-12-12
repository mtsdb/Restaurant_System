from decimal import Decimal
from django.db import models
from django.utils import timezone


class Invoice(models.Model):
    id = models.BigAutoField(primary_key=True)
    session = models.OneToOneField("tables_app.TableSession", on_delete=models.PROTECT, related_name="invoice")
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    service_charge = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    total = models.DecimalField(max_digits=10, decimal_places=2)
    paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"Invoice {self.id} (session={self.session_id})"
