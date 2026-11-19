from django.core.management.base import BaseCommand
from api.models import User

class Command(BaseCommand):
    help = 'Creates a default super/admin user using email if one does not exist.'

    def handle(self, *args, **options):
        email = 'superadmin@email.com'
        first_name = 'Super'
        last_name = 'Admin'
        password = 'abcd'

        if not User.objects.filter(email=email).exists():
            User.objects.create_superuser(
                email=email,
                first_name=first_name,
                last_name=last_name,
                password=password,
                is_admin=True
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully created super admin: {email}'))
        else:
            self.stdout.write(self.style.WARNING(f'Super admin with email "{email}" already exists.'))