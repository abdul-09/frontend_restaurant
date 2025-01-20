from django.urls import path, re_path, include
from django.views.generic import TemplateView
from rest_framework.routers import DefaultRouter
from .views import (
    MenuItemViewSet,
    CartViewSet,
    OrderViewSet,
    CategoryViewSet,
    ManagerViewSet,
    DeliveryCrewViewSet,
    TableViewSet,
    TableBookingViewSet,
    DeliveryOrderViewSet,
    UserManagementViewSet,
    logout_view,
    verify_payment,
)

router = DefaultRouter()

router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"menu-items", MenuItemViewSet, basename="menuitem")
router.register(r"orders", OrderViewSet, basename="order")
router.register(r"managers", ManagerViewSet, basename="manager")
router.register(r"delivery_crew", DeliveryCrewViewSet, basename="delivery-crew")
router.register(r'tables', TableViewSet, basename='table')
router.register(r'table-bookings', TableBookingViewSet, basename='table-booking')
router.register(r'delivery-orders', DeliveryOrderViewSet, basename='delivery-orders')
router.register(r'users', UserManagementViewSet, basename='users')
# router.register(r'cart', CartViewSet, basename='cart')

cart_list = CartViewSet.as_view({
    'get': 'list',
    'post': 'add_to_cart'
})

cart_detail = CartViewSet.as_view({
    'get': 'retrieve',
    'patch': 'partial_update',
    'delete': 'destroy'
})

urlpatterns = [
    path("", include(router.urls)),
    path("auth/", include("djoser.urls")),
    path("auth/", include("djoser.urls.jwt")),
    path("cart/", cart_list, name="cart-list"),
    path("cart/<int:pk>/", cart_detail, name="cart-detail"),
    path("auth/jwt/logout/", logout_view, name="auth-logout"),
    path('payments/verify/<int:order_id>/', verify_payment, name='verify-payment'),
    # Catch-all route for React
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]
