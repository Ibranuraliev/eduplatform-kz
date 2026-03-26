from rest_framework import serializers
from .models import User, TelegramAuthNonce


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    referred_by_code = serializers.CharField(
        required=False, allow_blank=True, write_only=True
    )

    class Meta:
        model = User
        fields = [
            'phone', 'first_name', 'last_name', 'password',
            'email',
            'city', 'grade', 'goal', 'school',
            'consent_personal_data', 'consent_privacy_policy',
            'referred_by_code'
        ]

    def create(self, validated_data):
        import random, string
        password = validated_data.pop('password')
        referred_by_code = validated_data.pop('referred_by_code', '') or ''

        # Find referrer if code provided
        referred_by = None
        if referred_by_code:
            try:
                referred_by = User.objects.get(referral_code=referred_by_code)
            except User.DoesNotExist:
                pass

        # Generate unique referral code for new user
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            if not User.objects.filter(referral_code=code).exists():
                break

        # Normalize phone: always store with leading +
        from .views import normalize_phone
        if 'phone' in validated_data:
            validated_data['phone'] = normalize_phone(validated_data['phone'])
        validated_data['username'] = validated_data['phone']
        user = User(**validated_data)
        user.set_password(password)
        user.referral_code = code
        if referred_by:
            user.referred_by = referred_by
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'phone', 'first_name', 'last_name', 'role',
            'city', 'grade', 'goal', 'school',
            'telegram_user_id', 'referral_code', 'created_at'
        ]
        read_only_fields = ['id', 'role', 'referral_code', 'created_at']


class TelegramNonceSerializer(serializers.ModelSerializer):
    class Meta:
        model = TelegramAuthNonce
        fields = ['phone', 'nonce', 'created_at']