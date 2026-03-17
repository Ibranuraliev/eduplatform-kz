from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0002_lessonprogress'),
    ]

    operations = [
        # Add 'individual' to course_type choices (no DB change, just validation)
        migrations.AlterField(
            model_name='course',
            name='course_type',
            field=models.CharField(
                choices=[
                    ('ent', 'ЕНТ'),
                    ('ielts', 'IELTS'),
                    ('sat', 'SAT'),
                    ('individual', 'Индивидуальный предмет'),
                ],
                max_length=20,
            ),
        ),
        # Add subject choices (no DB change, just validation + default)
        migrations.AlterField(
            model_name='course',
            name='subject',
            field=models.CharField(
                blank=True,
                default='',
                max_length=100,
                choices=[
                    ('', 'Не указан'),
                    ('ent_math', 'ЕНТ Математика'),
                    ('ent_kazakh', 'ЕНТ Казахский язык'),
                    ('ent_russian', 'ЕНТ Русский язык'),
                    ('ent_history', 'ЕНТ История Казахстана'),
                    ('ielts', 'IELTS'),
                    ('sat_math', 'SAT Математика'),
                    ('sat_english', 'SAT Английский'),
                    ('math', 'Математика'),
                    ('physics', 'Физика'),
                    ('chemistry', 'Химия'),
                    ('biology', 'Биология'),
                    ('english', 'Английский язык'),
                    ('kazakh', 'Казахский язык'),
                    ('russian', 'Русский язык'),
                    ('history', 'История'),
                    ('geography', 'География'),
                    ('informatics', 'Информатика'),
                    ('other', 'Другое'),
                ],
            ),
        ),
    ]
