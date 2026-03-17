from django.db import models
from users.models import User


class Conversation(models.Model):
    """A chat thread between one student and one teacher"""
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_conversations')
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='teacher_conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'teacher')
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.student} ↔ {self.teacher}"


class Message(models.Model):
    """A single chat message inside a conversation"""
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    text = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender} → {self.conversation}: {self.text[:50]}"
