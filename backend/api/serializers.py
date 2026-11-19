from rest_framework import serializers
from .models import User, Office, MeetingRoom, Booking


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
