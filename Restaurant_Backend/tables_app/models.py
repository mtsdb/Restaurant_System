from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError


class Table(models.Model):
	STATUS_AVAILABLE = "available"
	STATUS_OCCUPIED = "occupied"
	STATUS_CHOICES = [
		(STATUS_AVAILABLE, "Available"),
		(STATUS_OCCUPIED, "Occupied"),
	]

	id = models.BigAutoField(primary_key=True)
	number = models.PositiveIntegerField(unique=True)
	status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_AVAILABLE)

	def __str__(self):
		return f"Table {self.number} ({self.status})"


class TableSession(models.Model):
	STATUS_ACTIVE = "active"
	STATUS_CLOSED = "closed"
	STATUS_CHOICES = [
		(STATUS_ACTIVE, "Active"),
		(STATUS_CLOSED, "Closed"),
	]

	id = models.BigAutoField(primary_key=True)
	table = models.ForeignKey(Table, on_delete=models.CASCADE, related_name="sessions")
	started_at = models.DateTimeField(default=timezone.now)
	ended_at = models.DateTimeField(null=True, blank=True)
	status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)

	class Meta:
		ordering = ("-started_at",)

	def clean(self):
		# Ensure only one active session per table
		if self.status == self.STATUS_ACTIVE:
			qs = TableSession.objects.filter(table=self.table, status=self.STATUS_ACTIVE)
			if self.pk:
				qs = qs.exclude(pk=self.pk)
			if qs.exists():
				raise ValidationError("There is already an active session for this table.")

	def save(self, *args, **kwargs):
		self.full_clean()
		super().save(*args, **kwargs)

	def close(self):
		if self.status == self.STATUS_CLOSED:
			return
		self.status = self.STATUS_CLOSED
		self.ended_at = timezone.now()
		self.save()

	def __str__(self):
		return f"Session {self.id} - Table {self.table.number} ({self.status})"
