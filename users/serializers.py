from rest_framework import serializers
from .models import User, TelegramAuthNonce


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    email = serializers.EmailField(required=False, allow_blank=True, default='')
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

    def validate_phone(self, value):
        """Normalize phone first, then check uniqueness on the normalized value."""
        from .views import normalize_phone
        normalized = normalize_phone(value)
        # Check uniqueness for the normalized form (DRF's auto UniqueValidator only
        # checks the raw submitted value, so we cover the +7 vs 7 mismatch case)
        if self.instance is None:  # only on create
            if User.objects.filter(phone=normalized).exists():
                raise serializers.ValidationError(
                    'Пользователь с таким номером уже зарегистрирован.'
                )
        return normalized

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

        # phone is already normalized by validate_phone()
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