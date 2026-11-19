from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, Office, MeetingRoom, Booking
from rest_framework_simplejwt.tokens import RefreshToken


class EmailTokenObtainPairSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError('Both email and password are required.')

        # Because USERNAME_FIELD = 'email' on your User model,
        # Django's ModelBackend expects `username=email` in authenticate()
        user = authenticate(
            request=self.context.get('request'),
            username=email,
            password=password,
        )

        if not user:
            raise serializers.AuthenticationFailed('Invalid email or password.')

        if not user.is_active:
            raise serializers.AuthenticationFailed('User account is inactive.')

        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "password", "is_admin"]

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            password=validated_data["password"],
            is_admin=validated_data.get("is_admin", False),
        )
        return user


class MeetingRoomSerializer(serializers.ModelSerializer):
    office_name = serializers.ReadOnlyField(source="office.name")

    class Meta:
        model = MeetingRoom
        fields = ["id", "office", "office_name", "name", "capacity", "amenities"]


class OfficeSerializer(serializers.ModelSerializer):
    rooms = MeetingRoomSerializer(many=True, read_only=True)

    class Meta:
        model = Office
        fields = ["id", "name", "location", "rooms"]


class BookingSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source="user.username")
    room_name = serializers.ReadOnlyField(source="room.name")

    class Meta:
        model = Booking
        fields = [
            "id",
            "room",
            "room_name",
            "user",
            "user_name",
            "title",
            "start_time",
            "end_time",
        ]
        read_only_fields = ["user"]
