from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.utils import timezone


class ExpiringTokenAuthentication(TokenAuthentication):
    """
    Token authentication that checks token expiry.
    Tokens without an expiry record are treated as permanent (backward compatibility).
    """

    def authenticate_credentials(self, key):
        user, token = super().authenticate_credentials(key)

        try:
            expiry = token.expiry
            if expiry.expires_at < timezone.now():
                raise AuthenticationFailed(
                    'Token has expired. Use your refresh token to get a new one.',
                    code='token_expired'
                )
        except Exception as e:
            # Re-raise only our own AuthenticationFailed
            if getattr(e, 'code', None) == 'token_expired':
                raise
            # No expiry record → permanent token (backward compat)

        return (user, token)
