from django.db import models
from django.conf import settings

class Role(models.Model):
    name = models.CharField(max_length=100)
    is_admin = models.BooleanField(default=False)
    description = models.TextField()
    permissions = models.ManyToManyField('Permission', related_name='roles')

    def __str__(self):
        return self.name

class Permission(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name
