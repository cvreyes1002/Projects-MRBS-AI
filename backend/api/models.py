from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.exceptions import ValidationError


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_admin", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    username = None  # Remove username field
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    is_admin = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UserManager()

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"


class Office(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.location})"


class MeetingRoom(models.Model):
    office = models.ForeignKey(Office, related_name="rooms", on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    capacity = models.PositiveIntegerField()
    amenities = models.TextField(
        blank=True, help_text="e.g., Projector, Whiteboard, Video Conf"
    )

    def __str__(self):
        return f"{self.name} - {self.office.name}"


class Booking(models.Model):
    room = models.ForeignKey(
        MeetingRoom, related_name="bookings", on_delete=models.CASCADE
    )
    user = models.ForeignKey(User, related_name="bookings", on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError("End time must be after start time.")

        # Check for overlapping bookings
        overlapping = Booking.objects.filter(
            room=self.room, start_time__lt=self.end_time, end_time__gt=self.start_time
        ).exclude(pk=self.pk)

        if overlapping.exists():
            raise ValidationError(
                "This room is already booked for the selected time slot."
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
