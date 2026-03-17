from django.db import migrations


COURSES = [
    # ── ENT ───────────────────────────────────────────────────────────────────
    {
        'title':       'ЕНТ Математика',
        'course_type': 'ent',
        'subject':     'ent_math',
        'description': 'Подготовка к ЕНТ по математике. Алгебра, геометрия, теория вероятностей и статистика. '
                       'Разбор типовых задач и решение пробных вариантов.',
        'price':       '60000.00',
    },
    {
        'title':       'ЕНТ Казахский язык',
        'course_type': 'ent',
        'subject':     'ent_kazakh',
        'description': 'Подготовка к ЕНТ по казахскому языку. Грамматика, лексика, анализ текстов. '
                       'Отработка тестовых заданий и написание эссе.',
        'price':       '60000.00',
    },
    {
        'title':       'ЕНТ Русский язык',
        'course_type': 'ent',
        'subject':     'ent_russian',
        'description': 'Подготовка к ЕНТ по русскому языку. Орфография, пунктуация, синтаксис, '
                       'анализ текста. Практика выполнения тестовых заданий.',
        'price':       '60000.00',
    },
    {
        'title':       'ЕНТ История Казахстана',
        'course_type': 'ent',
        'subject':     'ent_history',
        'description': 'Подготовка к ЕНТ по истории Казахстана. Систематизация знаний от древности до '
                       'современности. Тесты, карты, даты и ключевые события.',
        'price':       '60000.00',
    },
    # ── IELTS ─────────────────────────────────────────────────────────────────
    {
        'title':       'IELTS',
        'course_type': 'ielts',
        'subject':     'ielts',
        'description': 'Комплексная подготовка к IELTS Academic / General Training. Listening, Reading, '
                       'Writing, Speaking. Стратегии выполнения заданий, практика пробных тестов.',
        'price':       '80000.00',
    },
    # ── SAT ───────────────────────────────────────────────────────────────────
    {
        'title':       'SAT Математика',
        'course_type': 'sat',
        'subject':     'sat_math',
        'description': 'Подготовка к математической части SAT. Алгебра, решение задач, анализ данных, '
                       'продвинутая математика. Разбор official practice tests.',
        'price':       '70000.00',
    },
    {
        'title':       'SAT Английский',
        'course_type': 'sat',
        'subject':     'sat_english',
        'description': 'Подготовка к секциям Reading и Writing SAT. Работа с текстами, грамматика, '
                       'словарный запас. Стратегии и пробные тесты.',
        'price':       '70000.00',
    },
    # ── Individual subjects ───────────────────────────────────────────────────
    {
        'title':       'Математика',
        'course_type': 'individual',
        'subject':     'math',
        'description': 'Углублённый курс математики для школьников 5–11 классов. '
                       'Алгебра, геометрия, функции, уравнения. Подготовка к контрольным и олимпиадам.',
        'price':       '40000.00',
    },
    {
        'title':       'Физика',
        'course_type': 'individual',
        'subject':     'physics',
        'description': 'Курс физики для 7–11 классов. Механика, термодинамика, электродинамика, оптика. '
                       'Решение задач, лабораторные разборы.',
        'price':       '40000.00',
    },
    {
        'title':       'Химия',
        'course_type': 'individual',
        'subject':     'chemistry',
        'description': 'Курс химии для 8–11 классов. Органическая и неорганическая химия. '
                       'Реакции, уравнения, решение расчётных задач.',
        'price':       '40000.00',
    },
    {
        'title':       'Биология',
        'course_type': 'individual',
        'subject':     'biology',
        'description': 'Курс биологии для 6–11 классов. Клетка, организм, экосистема, генетика. '
                       'Подготовка к контрольным, олимпиадам и ЕНТ.',
        'price':       '40000.00',
    },
    {
        'title':       'Английский язык',
        'course_type': 'individual',
        'subject':     'english',
        'description': 'Разговорный и академический английский. Грамматика, лексика, произношение. '
                       'Уровни A1–C1. Подготовка к школьным экзаменам и международным сертификатам.',
        'price':       '45000.00',
    },
    {
        'title':       'Казахский язык',
        'course_type': 'individual',
        'subject':     'kazakh',
        'description': 'Казахский язык для начинающих и продолжающих. Разговорная речь, грамматика, '
                       'чтение и письмо. Подготовка к школьным экзаменам.',
        'price':       '40000.00',
    },
    {
        'title':       'Русский язык',
        'course_type': 'individual',
        'subject':     'russian',
        'description': 'Русский язык для 5–11 классов. Орфография, пунктуация, развитие речи. '
                       'Подготовка к диктантам, сочинениям и олимпиадам.',
        'price':       '40000.00',
    },
    {
        'title':       'История',
        'course_type': 'individual',
        'subject':     'history',
        'description': 'Курс истории для 6–11 классов. Всемирная история и история Казахстана. '
                       'Ключевые события, даты, причинно-следственные связи.',
        'price':       '35000.00',
    },
    {
        'title':       'География',
        'course_type': 'individual',
        'subject':     'geography',
        'description': 'Курс географии для 6–11 классов. Физическая и экономическая география. '
                       'Карты, климат, природные зоны, население.',
        'price':       '35000.00',
    },
    {
        'title':       'Информатика',
        'course_type': 'individual',
        'subject':     'informatics',
        'description': 'Информатика и программирование для школьников. Основы Python, алгоритмы, '
                       'базы данных. Подготовка к олимпиадам и ЕНТ.',
        'price':       '45000.00',
    },
]


def create_courses(apps, schema_editor):
    Course = apps.get_model('courses', 'Course')
    for data in COURSES:
        # Only create if a course with this subject doesn't already exist
        if not Course.objects.filter(subject=data['subject']).exists():
            Course.objects.create(
                title=data['title'],
                course_type=data['course_type'],
                subject=data['subject'],
                description=data['description'],
                price=data['price'],
                is_active=True,
            )


def delete_courses(apps, schema_editor):
    Course = apps.get_model('courses', 'Course')
    subjects = [d['subject'] for d in COURSES]
    Course.objects.filter(subject__in=subjects).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0003_course_subject_choices'),
    ]

    operations = [
        migrations.RunPython(create_courses, reverse_code=delete_courses),
    ]
