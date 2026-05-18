from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core import exceptions
from .models import User, Post, Community, Tag, ConnectionRequest, CommunityMessage, CommunityReport, Comment, ChatMessage, Notification

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Tag.objects.all(), source='tags', required=False
    )

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password', 'matricula_estacio',
                  'curso', 'semestre', 'is_calouro', 'bio', 'xp', 'level', 'streak',
                  'streak_freeze_count', 'last_activity', 'avatar', 'push_token', 'tags', 'tag_ids']

    def validate_password(self, value):
        import re
        if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$', value):
            raise serializers.ValidationError(
                'A senha deve conter no mínimo 8 caracteres, incluindo pelo menos uma letra maiúscula, uma letra minúscula e um número.'
            )
        validate_password(value)
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data.get('username'),
            password=validated_data['password'],
            matricula_estacio=validated_data.get('matricula_estacio'),
            curso=validated_data.get('curso'),
            semestre=validated_data.get('semestre', 1),
            is_calouro=validated_data.get('is_calouro', True),
        )
        return user


class UserPublicSerializer(serializers.ModelSerializer):
    """Read-only serializer for public user listings (no password or email)."""
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'curso', 'semestre', 'is_calouro', 'bio', 'tags', 'rating', 'reviews_count', 'level', 'streak', 'avatar']


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    is_calouro = serializers.BooleanField(source='author.is_calouro', read_only=True)
    curso = serializers.CharField(source='author.curso', read_only=True)
    author_avatar = serializers.ImageField(source='author.avatar', read_only=True)
    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'content', 'image', 'author_name', 'is_calouro', 'curso', 'author_avatar', 'created_at',
            'likes_count', 'is_liked', 'is_bookmarked', 'comments_count'
        ]
        read_only_fields = ['author_name', 'is_calouro', 'curso', 'author_avatar', 'created_at']

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.bookmarks.filter(id=request.user.id).exists()
        return False

    def get_comments_count(self, obj):
        return obj.comments.count()

    def validate_content(self, value):
        import re
        from django.utils.html import strip_tags
        # Remove script tags and their contents completely
        value = re.sub(r'<script\b[^>]*>([\s\S]*?)<\/script>', '', value, flags=re.IGNORECASE)
        cleaned_value = strip_tags(value).strip()
        if not cleaned_value:
            raise serializers.ValidationError("O conteúdo do post não pode estar vazio ou conter apenas tags HTML.")
        return cleaned_value


# ==================== COMMUNITY ====================

class CommunityMessageSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    author_curso = serializers.CharField(source='author.curso', read_only=True)
    author_id = serializers.IntegerField(source='author.id', read_only=True)

    class Meta:
        model = CommunityMessage
        fields = ['id', 'content', 'author_name', 'author_curso', 'author_id', 'created_at']
        read_only_fields = ['author_name', 'author_curso', 'author_id', 'created_at']

    def validate_content(self, value):
        import re
        from django.utils.html import strip_tags
        # Remove script tags and their contents completely
        value = re.sub(r'<script\b[^>]*>([\s\S]*?)<\/script>', '', value, flags=re.IGNORECASE)
        cleaned_value = strip_tags(value).strip()
        if not cleaned_value:
            raise serializers.ValidationError("A mensagem não pode estar vazia ou conter apenas tags HTML.")
        return cleaned_value


class CommunitySerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    is_hot = serializers.SerializerMethodField()
    creator_name = serializers.CharField(source='creator.username', read_only=True)
    hot_score = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Community
        fields = [
            'id', 'name', 'description', 'icon', 'color', 'category',
            'creator_name', 'member_count', 'is_member', 'is_open',
            'is_hot', 'hot_score', 'created_at',
        ]

    def get_member_count(self, obj):
        if hasattr(obj, 'total_members'):
            return obj.total_members
        return obj.members.count()

    def get_is_member(self, obj):
        if hasattr(obj, 'is_member_annotated'):
            return obj.is_member_annotated
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.members.filter(id=request.user.id).exists()
        return False

    def get_is_hot(self, obj):
        score = getattr(obj, 'hot_score', 0)
        return score >= 5  # 5+ messages in 24h = "Em alta"


class CommunityCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Community
        fields = ['name', 'description', 'icon', 'color', 'category']

    def validate_name(self, value):
        import re
        from django.utils.html import strip_tags
        # Remove script tags and their contents completely
        value = re.sub(r'<script\b[^>]*>([\s\S]*?)<\/script>', '', value, flags=re.IGNORECASE)
        cleaned_value = strip_tags(value).strip()
        if not cleaned_value:
            raise serializers.ValidationError("O nome da comunidade não pode estar vazio.")
        return cleaned_value

    def validate_description(self, value):
        import re
        from django.utils.html import strip_tags
        # Remove script tags and their contents completely
        value = re.sub(r'<script\b[^>]*>([\s\S]*?)<\/script>', '', value, flags=re.IGNORECASE)
        return strip_tags(value).strip()

    def validate(self, data):
        user = self.context['request'].user
        if user.created_communities.count() >= 3:
            raise serializers.ValidationError(
                'Você atingiu o limite de 3 quadros criados. Delete um existente para criar outro.'
            )
        return data

    def create(self, validated_data):
        user = self.context['request'].user
        community = Community.objects.create(creator=user, **validated_data)
        community.members.add(user)  # Creator auto-joins
        return community


class CommunityReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityReport
        fields = ['reason', 'details']


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'post', 'author', 'author_name', 'content', 'parent', 'replies', 'created_at']
        read_only_fields = ['post', 'author', 'author_name', 'created_at']

    def get_replies(self, obj):
        # Recursively serialize child replies
        serializer = CommentSerializer(obj.replies.all(), many=True, context=self.context)
        return serializer.data

    def validate_content(self, value):
        import re
        from django.utils.html import strip_tags
        value = re.sub(r'<script\b[^>]*>([\s\S]*?)<\/script>', '', value, flags=re.IGNORECASE)
        cleaned_value = strip_tags(value).strip()
        if not cleaned_value:
            raise serializers.ValidationError("O conteúdo do comentário não pode estar vazio.")
        return cleaned_value


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    receiver_name = serializers.CharField(source='receiver.username', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'sender_name', 'receiver', 'receiver_name', 'content', 'is_read', 'created_at']
        read_only_fields = ['sender', 'sender_name', 'receiver_name', 'is_read', 'created_at']

    def validate_content(self, value):
        import re
        from django.utils.html import strip_tags
        value = re.sub(r'<script\b[^>]*>([\s\S]*?)<\/script>', '', value, flags=re.IGNORECASE)
        cleaned_value = strip_tags(value).strip()
        if not cleaned_value:
            raise serializers.ValidationError("A mensagem não pode estar vazia.")
        return cleaned_value


class NotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'sender', 'sender_name', 'notification_type', 'post', 'content', 'is_read', 'created_at']
        read_only_fields = ['recipient', 'sender', 'sender_name', 'notification_type', 'post', 'content', 'is_read', 'created_at']


class ConnectionRequestSerializer(serializers.ModelSerializer):
    sender_detail = UserPublicSerializer(source='sender', read_only=True)
    receiver_detail = UserPublicSerializer(source='receiver', read_only=True)

    class Meta:
        model = ConnectionRequest
        fields = ['id', 'sender', 'receiver', 'status', 'created_at', 'updated_at', 'sender_detail', 'receiver_detail']