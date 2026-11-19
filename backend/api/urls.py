from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import UserViewSet, OfficeViewSet, MeetingRoomViewSet, BookingViewSet
from .serializers import EmailTokenObtainPairView

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'offices', OfficeViewSet)
router.register(r'rooms', MeetingRoomViewSet)
router.register(r'bookings', BookingViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('token/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]