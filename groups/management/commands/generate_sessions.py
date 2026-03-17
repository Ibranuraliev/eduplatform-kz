from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, datetime, time
from groups.models import Group, GroupSession

DAY_MAP = {
    'пн': 0, 'понедельник': 0,
    'вт': 1, 'вторник': 1,
    'ср': 2, 'среда': 2,
    'чт': 3, 'четверг': 3,
    'пт': 4, 'пятница': 4,
    'сб': 5, 'суббота': 5,
    'вс': 6, 'воскресенье': 6,
}


def parse_days(schedule_days_str):
    """Parse 'понедельник, среда, пятница' → [0, 2, 4]"""
    if not schedule_days_str:
        return []
    days = []
    for part in schedule_days_str.lower().replace(',', ' ').split():
        part = part.strip()
        if part in DAY_MAP:
            days.append(DAY_MAP[part])
    return list(set(days))


class Command(BaseCommand):
    help = 'Generate GroupSession records for the next N days based on group schedules'

    def add_arguments(self, parser):
        parser.add_argument('--days', type=int, default=14, help='How many days ahead to generate (default: 14)')

    def handle(self, *args, **options):
        days_ahead = options['days']
        today = timezone.now().date()
        end_date = today + timedelta(days=days_ahead)

        groups = Group.objects.filter(
            is_active=True,
            schedule_time__isnull=False,
        ).exclude(schedule_days='')

        created_count = 0
        skipped_count = 0

        for group in groups:
            weekdays = parse_days(group.schedule_days)
            if not weekdays:
                self.stdout.write(f'  ⚠ Group "{group.name}" has no parseable schedule_days: "{group.schedule_days}"')
                continue

            current = today
            while current <= end_date:
                if current.weekday() in weekdays:
                    scheduled_at = timezone.make_aware(
                        datetime.combine(current, group.schedule_time)
                    )

                    # Skip if session already exists for this group at this time
                    exists = GroupSession.objects.filter(
                        group=group,
                        scheduled_at=scheduled_at,
                    ).exists()

                    if not exists:
                        GroupSession.objects.create(
                            group=group,
                            scheduled_at=scheduled_at,
                            duration_minutes=90,
                            status='scheduled',
                        )
                        created_count += 1
                    else:
                        skipped_count += 1

                current += timedelta(days=1)

        self.stdout.write(self.style.SUCCESS(
            f'✅ Done! Created: {created_count} sessions, Skipped (already exist): {skipped_count}'
        ))