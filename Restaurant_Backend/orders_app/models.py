from django.db import models
from django.conf import settings
from django.utils import timezone


class Order(models.Model):
	id = models.BigAutoField(primary_key=True)
	session = models.ForeignKey("tables_app.TableSession", on_delete=models.CASCADE, related_name="orders")
	created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_orders")
	created_at = models.DateTimeField(default=timezone.now)

	class Meta:
		ordering = ("-created_at",)

	def __str__(self):
		return f"Order {self.id} (session={self.session_id})"


class OrderItem(models.Model):
	STATUS_WAITING = "waiting"
	STATUS_IN_PROGRESS = "in_progress"
	STATUS_READY = "ready"
	STATUS_SERVED = "served"
	STATUS_CHOICES = [
		(STATUS_WAITING, "Waiting"),
		(STATUS_IN_PROGRESS, "In Progress"),
		(STATUS_READY, "Ready"),
		(STATUS_SERVED, "Served"),
	]

	id = models.BigAutoField(primary_key=True)
	order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
	item = models.ForeignKey("menu_app.Item", on_delete=models.PROTECT, related_name="order_items")
	quantity = models.PositiveIntegerField(default=1)
	note_to_chef = models.TextField(blank=True)
	price_snapshot = models.DecimalField(max_digits=8, decimal_places=2)
	status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_WAITING)
	created_at = models.DateTimeField(default=timezone.now)

	class Meta:
		ordering = ("created_at",)

	def __str__(self):
		return f"OrderItem {self.id} - {self.item.name} x{self.quantity} ({self.status})"
