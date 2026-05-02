from rest_framework import serializers
from .models import User, Post, Community


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password', 'matricula_estacio',
                  'curso', 'semestre', 'is_calouro', 'bio']

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
    class Meta:
        model = User
        fields = ['id', 'username', 'curso', 'semestre', 'is_calouro', 'bio']


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    is_calouro = serializers.BooleanField(source='author.is_calouro', read_only=True)
    curso = serializers.CharField(source='author.curso', read_only=True)

    class Meta:
        model = Post
        fields = ['id', 'content', 'author_name', 'is_calouro', 'curso', 'created_at']
        read_only_fields = ['author_name', 'is_calouro', 'curso', 'created_at']


class CommunitySerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Community
        fields = ['id', 'name', 'description', 'icon', 'color', 'member_count']

    def get_member_count(self, obj):
        return obj.members.count()