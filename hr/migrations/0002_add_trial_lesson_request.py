from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('hr', '0001_initial'),
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='TrialLessonRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('full_name', models.CharField(max_length=200)),
                ('phone', models.CharField(max_length=20)),
                ('grade', models.CharField(blank=True, max_length=20)),
                ('subject', models.CharField(choices=[
                    ('ent_math', 'ENT Mathematics'), ('ent_kazakh', 'ENT Kazakh'),
                    ('ent_russian', 'ENT Russian'), ('ent_history', 'ENT History of Kazakhstan'),
                    ('ielts', 'IELTS'), ('sat_math', 'SAT Mathematics'),
                    ('sat_english', 'SAT English'), ('physics', 'Physics'),
                    ('chemistry', 'Chemistry'), ('biology', 'Biology'), ('other', 'Other'),
                ], max_length=50)),
                ('goal', models.CharField(blank=True, max_length=300)),
                ('convenient_time', models.CharField(blank=True, max_length=200)),
                ('comment', models.TextField(blank=True)),
                ('status', models.CharField(choices=[
                    ('new', 'New'), ('contacted', 'Contacted'), ('scheduled', 'Scheduled'),
                    ('completed', 'Completed'), ('cancelled', 'Cancelled'),
                ], default='new', max_length=20)),
                ('manager_note', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('handled_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='handled_trial_requests', to='users.user'
                )),
            ],
            options={'ordering': ['-created_at']},
        ),
    ]