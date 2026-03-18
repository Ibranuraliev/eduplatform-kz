import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = 'Creates a superuser from env vars if none exists'

    def handle(self, *args, **options):
        User = get_user_model()
        phone = os.environ.get('DJANGO_SUPERUSER_PHONE')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

        if not phone or not password:
            self.stdout.write(self.style.WARNING(
                'DJANGO_SUPERUSER_PHONE or DJANGO_SUPERUSER_PASSWORD not set — skipping superuser creation'
            ))
            return

        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write(self.style.SUCCESS('Superuser already exists — skipping'))
            return

        User.objects.create_superuser(phone=phone, password=password)
        self.stdout.write(self.style.SUCCESS(f'Superuser created: {phone}'))
