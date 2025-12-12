from django.db import models


class Setting(models.Model):
    id = models.BigAutoField(primary_key=True)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    service_charge_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    discount_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    def __str__(self):
        return "Settings"
