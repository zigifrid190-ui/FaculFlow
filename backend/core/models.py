from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True)
    matricula_estacio = models.CharField(max_length=20, blank=True, null=True, unique=True)
    curso = models.CharField(max_length=100, blank=True, null=True)
    semestre = models.PositiveIntegerField(default=1)
    is_calouro = models.BooleanField(default=True)
    bio = models.TextField(blank=True, null=True, max_length=300)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email} - {self.curso or 'Sem curso'}"


class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author.username}: {self.content[:50]}"


class Community(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, max_length=500)
    icon = models.CharField(max_length=10, default='📚')
    color = models.CharField(max_length=7, default='#00BFA5')
    members = models.ManyToManyField(User, related_name='communities', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'communities'

    def __str__(self):
        return self.name