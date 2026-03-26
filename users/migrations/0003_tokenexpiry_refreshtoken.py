from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_user_is_email_verified_emailverificationcode'),
        ('authtoken', '0003_tokenproxy'),
    ]

    operations = [
        migrations.CreateModel(
            name='TokenExpiry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('expires_at', models.DateTimeField()),
                ('token', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='expiry', to='authtoken.token')),
            ],
        ),
        migrations.CreateModel(
            name='RefreshToken',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token', models.CharField(max_length=64, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField()),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='refresh_token_obj', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
