from django.contrib.auth.models import AbstractUser
from django.db import models

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    email = models.EmailField(unique=True)
    matricula_estacio = models.CharField(max_length=20, blank=True, null=True, unique=True)
    curso = models.CharField(max_length=100, blank=True, null=True)
    semestre = models.PositiveIntegerField(default=1)
    is_calouro = models.BooleanField(default=True)
    bio = models.TextField(blank=True, null=True, max_length=300)
    tags = models.ManyToManyField(Tag, related_name='users', blank=True)
    rating = models.FloatField(default=0.0)
    reviews_count = models.PositiveIntegerField(default=0)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    push_token = models.CharField(max_length=255, blank=True, null=True)
    
    # Gamification and Battle Pass fields
    xp = models.PositiveIntegerField(default=0)
    level = models.PositiveIntegerField(default=1)
    streak = models.PositiveIntegerField(default=0)
    streak_freeze_count = models.PositiveIntegerField(default=1)
    last_activity = models.DateTimeField(blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email} - {self.curso or 'Sem curso'}"


class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField(max_length=1000)
    image = models.ImageField(upload_to='posts/', blank=True, null=True)
    likes = models.ManyToManyField(User, related_name='liked_posts', blank=True)
    bookmarks = models.ManyToManyField(User, related_name='bookmarked_posts', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author.username}: {self.content[:50]}"


class Community(models.Model):
    CATEGORY_CHOICES = (
        ('curso', 'Curso'),
        ('tema', 'Tema'),
        ('ano', 'Ano'),
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, max_length=500)
    icon = models.CharField(max_length=10, default='📚')
    color = models.CharField(max_length=7, default='#00897B')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='tema')
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_communities')
    members = models.ManyToManyField(User, related_name='communities', blank=True)
    is_open = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'communities'

    def __str__(self):
        return f"{self.icon} {self.name}"


class CommunityMessage(models.Model):
    """A single message/post inside a community board (forum-style)."""
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='messages')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='community_messages')
    content = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author.username} em {self.community.name}: {self.content[:40]}"


class CommunityReport(models.Model):
    """Report a community board for irregularities."""
    REASON_CHOICES = (
        ('spam', 'Spam'),
        ('ofensivo', 'Conteúdo Ofensivo'),
        ('irrelevante', 'Conteúdo Irrelevante'),
        ('outro', 'Outro'),
    )
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='reports')
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='community_reports')
    reason = models.CharField(max_length=20, choices=REASON_CHOICES, default='outro')
    details = models.TextField(blank=True, max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('community', 'reporter')

    def __str__(self):
        return f"Report: {self.community.name} por {self.reporter.username}"

class ConnectionRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pendente'),
        ('accepted', 'Aceito'),
        ('rejected', 'Rejeitado'),
        ('skipped', 'Pulado'),
    )
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('sender', 'receiver')

    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username} ({self.status})"


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField(max_length=500)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.author.username} em Post {self.post.id}: {self.content[:30]}"


class ChatMessage(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField(max_length=1000)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username}: {self.content[:30]}"


class Notification(models.Model):
    TYPE_CHOICES = (
        ('like', 'Like'),
        ('comment', 'Comentário'),
        ('match', 'Match de Mentoria'),
        ('message', 'Mensagem Chat'),
    )
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications')
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, blank=True)
    content = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notif {self.notification_type} para {self.recipient.username}"


class BattlePassReward(models.Model):
    REWARD_TYPE_CHOICES = (
        ('desconto', 'Desconto na Mensalidade'),
        ('horas', 'Horas Extracurriculares'),
        ('brinde', 'Brinde Físico'),
    )
    level_required = models.PositiveIntegerField(unique=True)
    title = models.CharField(max_length=100)
    description = models.TextField()
    reward_type = models.CharField(max_length=20, choices=REWARD_TYPE_CHOICES, default='brinde')
    icon = models.CharField(max_length=10, default='🎁')
    claimed_by = models.ManyToManyField(User, related_name='claimed_rewards', blank=True)

    class Meta:
        ordering = ['level_required']

    def __str__(self):
        return f"Nível {self.level_required}: {self.title}"