from django.shortcuts import render
from rest_framework.response import Response
from .models import MenuItem, Cart, CartItem, Order, OrderItem, Category, Table, TableBooking
from .serializers import (
    CategorySerializer,
    MenuItemSerializer,
    CartItemSerializer,
    CartSerializer,
    OrderItemSerializer,
    OrderSerializer,
    UserSerializer,
    CustomOrderSerializer,
    TableSerializer,
    TableBookingSerializer,
)
from rest_framework import viewsets, status, filters, permissions
from rest_framework.permissions import (
    IsAuthenticated,
    IsAuthenticatedOrReadOnly,
    IsAdminUser,
)
from django.shortcuts import get_object_or_404
from .permissions import IsManager, IsDeliveryCrew
from django.contrib.auth.models import User, Group
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from datetime import datetime, timedelta
from django.db import transaction
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from datetime import datetime, timezone
from django.views.decorators.csrf import csrf_protect
from django.utils.decorators import method_decorator
from rest_framework.decorators import api_view, permission_classes
from django.views.decorators.csrf import ensure_csrf_cookie
from djoser.views import UserViewSet
from django.contrib.auth import get_user_model

User = get_user_model()  # Get the custom User model


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsManager]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]


class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [IsManager]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["category", "featured"]
    search_fields = ["title"]
    ordering_fields = ["price"]


class CartViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        List all cart items
        """
        cart, created = Cart.objects.get_or_create(customer=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """
        Get an item from cart
        """
        cart_item = get_object_or_404(CartItem, cart__customer=self.request.user, pk=pk)
        serializer = CartItemSerializer(cart_item)
        return Response(serializer.data)

    def add_to_cart(self, request):
        """
        Add an item to cart
        """
        cart, created = Cart.objects.get_or_create(customer=request.user)

        item_id = request.data.get("menuitem")
        quantity = int(request.data.get("quantity", 1))
        menuitem = get_object_or_404(MenuItem, pk=item_id)

        if quantity < 0:
            return Response(
                {"detail": "quantity cannot be negative", "status": "fail"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart, menuitem=menuitem
        )

        if not created:
            cart_item.quantity = quantity
        else:
            cart_item.quantity = quantity

        cart_item.save()

        # Serialize the cart item after it's saved
        serializer = CartItemSerializer(cart_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def remove_from_cart(self, request, pk=None):
        """
        Remove an item from cart
        """
        cart_item = get_object_or_404(CartItem, cart__customer=request.user, pk=pk)
        cart_item.delete()
        return Response(
            {"detail": "Item removed from cart", "status": "ok"},
            status=status.HTTP_204_NO_CONTENT,
        )


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name="Managers").exists():
            return Order.objects.all()
        elif user.groups.filter(name="Crew").exists():
            return Order.objects.filter(delivery_crew=user)
        return Order.objects.filter(customer=user)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        cart_items = CartItem.objects.filter(cart__customer=request.user)
        if not cart_items.exists():
            return Response(
                {"error": "Cart is empty"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save(customer=request.user)

        # Create order items
        for cart_item in cart_items:
            OrderItem.objects.create(
                order=order,
                menuitem=cart_item.menuitem,
                quantity=cart_item.quantity,
                price=cart_item.unit_price
            )

        # Clear cart
        cart_items.delete()

        return Response(
            self.get_serializer(order).data,
            status=status.HTTP_201_CREATED
        )

    def partial_update(self, request, *args, **kwargs):
        order = self.get_object()
        user = request.user

        # Only managers can assign delivery crew
        if 'delivery_crew' in request.data:
            if not user.groups.filter(name="Managers").exists():
                return Response(
                    {"error": "Only managers can assign delivery crew"},
                    status=status.HTTP_403_FORBIDDEN
                )
            if order.delivery_type != 'delivery':
                return Response(
                    {"error": "Delivery crew can only be assigned to delivery orders"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Only delivery crew can update status of their assigned orders
        if 'status' in request.data:
            if user.groups.filter(name="Crew").exists():
                if order.delivery_crew != user:
                    return Response(
                        {"error": "You can only update your assigned orders"},
                        status=status.HTTP_403_FORBIDDEN
                    )
            elif not user.groups.filter(name="Managers").exists():
                return Response(
                    {"error": "You don't have permission to update order status"},
                    status=status.HTTP_403_FORBIDDEN
                )

        return super().partial_update(request, *args, **kwargs)


class ManagerViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(groups__name="Managers")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = UserSerializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request):
        user = get_object_or_404(User, email=request.data.get("email"))
        manager_group, created = Group.objects.get_or_create(name="Managers")
        if manager_group.user_set.filter(id=user.id).exists():
            return Response(
                {"detail": "User already exists in Managers group."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        manager_group.user_set.add(user)
        return Response(
            {"detail": "User is added to Managers group.", "status": "ok"},
            status=status.HTTP_201_CREATED,
        )

    def retrieve(self, request, pk=None):
        queryset = self.get_queryset()
        user = get_object_or_404(queryset, pk=pk)
        serializer = UserSerializer(user)
        return Response(serializer.data)

    def destroy(self, request, pk=None):
        user = get_object_or_404(User, pk=pk)
        manager_group = Group.objects.get(name="Managers")
        if not manager_group.user_set.filter(id=user.id).exists():
            return Response(
                {"detail": "User is not in Managers group.", "status": "fail"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        manager_group.user_set.remove(user)
        return Response(
            {"detail": "User is removed from Managers group.", "status": "ok"},
            status=status.HTTP_204_NO_CONTENT,
        )


class DeliveryCrewViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsManager]
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(groups__name="Crew")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = UserSerializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request):
        user = get_object_or_404(User, email=request.data.get("email"))
        crew_group, created = Group.objects.get_or_create(name="Crew")
        if crew_group.user_set.filter(id=user.id).exists():
            return Response(
                {"detail": "User already exists in Delivery Crew group."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        crew_group.user_set.add(user)
        return Response(
            {"detail": "User is added to Delivery Crew group.", "status": "ok"},
            status=status.HTTP_201_CREATED,
        )

    def retrieve(self, request, pk=None):
        queryset = self.get_queryset()
        user = get_object_or_404(queryset, pk=pk)
        serializer = UserSerializer(user)
        return Response(serializer.data)

    def destroy(self, request, pk=None):
        user = get_object_or_404(User, pk=pk)
        crew_group = Group.objects.get(name="Crew")
        if not crew_group.user_set.filter(id=user.id).exists():
            return Response(
                {"detail": "User is not in Delivery Crew group.", "status": "fail"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        crew_group.user_set.remove(user)
        return Response(
            {"detail": "User is removed from Delivery Crew group.", "status": "ok"},
            status=status.HTTP_204_NO_CONTENT,
        )


class TableViewSet(viewsets.ModelViewSet):
    queryset = Table.objects.all()
    serializer_class = TableSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return super().get_permissions()


class TableBookingViewSet(viewsets.ModelViewSet):
    serializer_class = TableBookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return TableBooking.objects.all()
        return TableBooking.objects.filter(customer=user)

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)

    @action(detail=False, methods=['GET'])
    def available_tables(self, request):
        date = request.query_params.get('date')
        time = request.query_params.get('time')
        guests = request.query_params.get('guests', 1)

        if not all([date, time]):
            return Response(
                {"error": "Date and time are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find available tables logic here
        booked_tables = TableBooking.objects.filter(
            booking_date=date,
            booking_time=time,
            status__in=['pending', 'confirmed']
        ).values_list('table_id', flat=True)

        available_tables = Table.objects.filter(
            capacity__gte=guests,
            is_active=True
        ).exclude(id__in=booked_tables)

        serializer = TableSerializer(available_tables, many=True)
        return Response(serializer.data)


class CookieTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            
            if response.status_code == 200:
                # Set tokens in HTTP-only cookies
                response.set_cookie(
                    'access_token',
                    response.data['access'],
                    httponly=True,
                    secure=True,
                    samesite='Lax',
                    max_age=60 * 15  # 15 minutes
                )
                response.set_cookie(
                    'refresh_token',
                    response.data['refresh'],
                    httponly=True,
                    secure=True,
                    samesite='Lax',
                    max_age=60 * 60 * 24  # 1 day
                )
                
                # Remove tokens from response body
                response.data = {"detail": "Login successful"}
            
            return response
            
        except Exception as e:
            return Response(
                {"detail": "Login failed"},
                status=status.HTTP_401_UNAUTHORIZED
            )


class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')
        
        if refresh_token:
            request.data['refresh'] = refresh_token
        
        try:
            response = super().post(request, *args, **kwargs)
            
            if response.status_code == 200:
                response.set_cookie(
                    'access_token',
                    response.data['access'],
                    httponly=True,
                    secure=True,
                    samesite='Lax',
                    max_age=60 * 15
                )
                
                # Remove token from response body
                response.data = {"detail": "Token refresh successful"}
            
            return response
            
        except (InvalidToken, TokenError) as e:
            return Response(
                {"detail": "Invalid refresh token"},
                status=status.HTTP_401_UNAUTHORIZED
            )


@api_view(['POST'])
# @permission_classes([IsAuthenticated])
@ensure_csrf_cookie
def logout_view(request):
        # Delete the user's tokens here if you're storing them
        response = Response({"detail": "Successfully logged out"})
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return response



class CustomUserViewSet(UserViewSet):
    def perform_create(self, serializer):
        user = serializer.save()
        customer_group = Group.objects.get_or_create(name='Customers')[0]
        user.groups.add(customer_group)


class DeliveryOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsDeliveryCrew]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(
            delivery_crew=self.request.user,
            delivery_type='delivery'
        ).order_by('-created')

    @action(detail=True, methods=['PATCH'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status not in ['pending', 'in_transit', 'delivered']:
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        order.status = new_status
        order.save()
        return Response(self.get_serializer(order).data)


class UserManagementViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsManager]
    serializer_class = UserSerializer
    queryset = User.objects.all()

    @action(detail=True, methods=['POST'])
    def update_role(self, request, pk=None):
        user = self.get_object()
        new_role = request.data.get('role')
        
        if not new_role:
            return Response({
                'status': 'error',
                'message': 'Role is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Remove user from all existing groups
        user.groups.clear()
        
        try:
            # Map role names to group names
            role_mapping = {
                'manager': 'Managers',
                'delivery': 'Crew',
                'customer': 'Customers'
            }
            
            group_name = role_mapping.get(new_role.lower())
            if not group_name:
                return Response({
                    'status': 'error',
                    'message': f'Invalid role: {new_role}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            group = Group.objects.get_or_create(name=group_name)[0]
            user.groups.add(group)
            
            return Response({
                'status': 'success',
                'message': f'User role updated to {group_name}',
                'role': group_name
            })
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    def get_queryset(self):
        """Override to exclude superusers from the list"""
        return User.objects.filter(is_superuser=False)
