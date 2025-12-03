from django.db import models


class Category(models.Model):
	id = models.BigAutoField(primary_key=True)
	name = models.CharField(max_length=200, unique=True)

	def __str__(self):
		return self.name


class Item(models.Model):
	TYPE_FOOD = "food"
	TYPE_DRINK = "drink"
	TYPE_CHOICES = [
		(TYPE_FOOD, "Food"),
		(TYPE_DRINK, "Drink"),
	]

	id = models.BigAutoField(primary_key=True)
	category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="items")
	name = models.CharField(max_length=200)
	description = models.TextField(blank=True)
	price = models.DecimalField(max_digits=8, decimal_places=2)
	available = models.BooleanField(default=True)
	type = models.CharField(max_length=10, choices=TYPE_CHOICES, default=TYPE_FOOD)

	class Meta:
		unique_together = ("category", "name")

	def __str__(self):
		return f"{self.name} ({self.type})"
