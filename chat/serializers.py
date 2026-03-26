from rest_framework import serializers
from .models import Conversation, Message
from users.models import User


class UserShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'phone', 'role']


class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender_id', 'sender_name', 'text', 'is_read', 'created_at']

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.phone


class ConversationSerializer(serializers.ModelSerializer):
    student = UserShortSerializer(read_only=True)
    teacher = UserShortSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'student', 'teacher', 'last_message', 'unread_count', 'updated_at']

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if msg:
            return {
                'text': msg.text,
                'created_at': msg.created_at,
                'sender_id': msg.sender_id,
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
