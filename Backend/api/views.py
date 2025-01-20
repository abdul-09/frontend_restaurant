from django.shortcuts import render
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from decimal import Decimal

from .models import MenuItem, Cart, CartItem, Order, OrderItem, Category, Table, TableBooking
from .utils import generate_unique_order_reference
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
from rest_framework.views import APIView
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from rest_framework.permissions import AllowAny
from django.utils.http import urlsafe_base64_encode
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_bytes
from djoser.views import UserViewSet
from django.contrib.auth import get_user_model
import logging
import requests
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

User = get_user_model()  # Get the custom User model

logger = logging.getLogger(__name__)



class PasswordResetView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User with this email does not exist.'}, status=status.HTTP_400_BAD_REQUEST)

        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        reset_link = f"https://frontend-restaurant-orcin.vercel.app/reset-password/?uid={uid}&token={token}/"
        send_mail(
            'Password Reset',
            f'Click the link to reset your password: {reset_link}',
            'no-reply@yourdomain.com',
            [email],
            fail_silently=False,
        )


        return Response({'message': 'Password reset link sent.'}, status=status.HTTP_200_OK)
    
class PasswordResetConfirmView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        re_new_password = request.data.get('re_new_password')

        print("Received UID:", uid)
        print("Received Token:", token)
        print("New Password:", new_password)
        print("Re-New Password:", re_new_password)

        if not all([uid, token, new_password, re_new_password]):
            return Response({'error': 'All fields are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            u_id = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=u_id)
        except User.DoesNotExist:
            return Response({'error': 'Invalid user ID.'}, status=status.HTTP_400_BAD_REQUEST)

        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        
        return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)
    

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
        Get a specific cart item
        """
        cart_item = get_object_or_404(CartItem, cart__customer=request.user, pk=pk)
        serializer = CartItemSerializer(cart_item)
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        """
        Update quantity of a cart item
        """
        try:
            cart_item = get_object_or_404(CartItem, cart__customer=request.user, pk=pk)
            quantity = request.data.get('quantity')
            
            if quantity is not None:
                quantity = int(quantity)
                if quantity <= 0:
                    return Response(
                        {"detail": "Quantity must be positive"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                cart_item.quantity = quantity
                cart_item.save()
                
                # Return the updated cart
                cart = cart_item.cart
                print("Cart item saved:", cart)
                cart_serializer = CartSerializer(cart)
                return Response(cart_serializer.data)
            
            return Response(
                {"detail": "Quantity is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except ValueError:
            return Response(
                {"detail": "Invalid quantity value"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, pk=None):
        """
        Remove an item from cart
        """
        cart_item = get_object_or_404(CartItem, cart__customer=request.user, pk=pk)
        cart_item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def add_to_cart(self, request):
        """
        Add an item to cart
        """
        try:
            print("Received data:", request.data)
            
            cart, created = Cart.objects.get_or_create(customer=request.user)

            item_id = request.data.get("menuitem")
            if not item_id:
                return Response(
                    {"detail": "menuitem is required", "received_data": request.data},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                quantity = int(request.data.get("quantity", 1))
            except (TypeError, ValueError):
                return Response(
                    {"detail": "Invalid quantity value", "received_data": request.data},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                menuitem = MenuItem.objects.get(pk=item_id)
            except MenuItem.DoesNotExist:
                return Response(
                    {"detail": f"Menu item with id {item_id} not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            if quantity <= 0:
                return Response(
                    {"detail": "Quantity must be positive"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                menuitem=menuitem,
                defaults={
                    'price': menuitem.price,
                    'quantity': quantity,
                    'image': menuitem.image
                }
            )

            if not created:
                cart_item.quantity += quantity
            else:
                cart_item.quantity = quantity
                cart_item.price = menuitem.price
                cart_item.image = menuitem.image

            cart_item.save()
            
            # Return the updated cart
            cart_serializer = CartSerializer(cart)
            return Response(cart_serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print("Error in add_to_cart:", str(e))
            return Response(
                {
                    "detail": "Error adding to cart",
                    "error": str(e),
                    "received_data": request.data
                },
                status=status.HTTP_400_BAD_REQUEST
            )


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    queryset = Order.objects.all()

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        try:
            print(f"Incoming order data: {request.data}")

            print(f"request.user.id: {request.user.id}")
            
            # Validate delivery type
            delivery_data = request.data.get('delivery', {})
            delivery_type = delivery_data.get('type')
            
            if delivery_type not in ['delivery', 'pickup', 'dine-in']:
                return Response(
                    {"error": "Invalid delivery type"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Generate unique reference with lock
            with transaction.atomic():
                reference = generate_unique_order_reference()
                # Double-check if reference exists
                while Order.objects.filter(reference=reference).exists():
                    reference = generate_unique_order_reference()

            # Validate delivery data based on type
            if delivery_type == 'delivery':
                required_fields = ['address', 'contactNumber']
            elif delivery_type in ['pickup', 'dine-in']:
                required_fields = ['contactNumber', 'preferredTime']
            
            missing_fields = [field for field in required_fields 
                            if not delivery_data.get(field)]
            
            if missing_fields:
                return Response(
                    {
                        "error": f"Missing required fields for {delivery_type}",
                        "missing_fields": missing_fields
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Prepare order data
            order_data = {
                'customer': request.user.id,  # Changed from userId to customer
                'reference': reference,
                'items': request.data.get('items', []),
                'status': 'pending',
                'subtotal': request.data.get('subtotal'),
                'tax': request.data.get('tax'),
                'deliveryFee': request.data.get('deliveryFee', 0),
                'total': request.data.get('total'),
                'paymentMethod': request.data.get('paymentMethod'),
                'delivery': delivery_data
            }

            # Create order using serializer
            serializer = self.get_serializer(data=order_data)
            
            if not serializer.is_valid():
                logger.error(f"Serializer validation errors: {serializer.errors}")
                return Response(
                    {"error": "Invalid order data", "details": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                with transaction.atomic():
                    order = serializer.save()
                    print(f"Serialized order data: {OrderSerializer(order).data}")
                    print(f"Order created successfully: {order.reference}")
                    print(order)
                    
                    # Clear the user's cart
                    CartItem.objects.filter(cart__customer=request.user).delete()

                    # Serialize the created order
                    

                    return Response(
                        {
                            "message": "Order created successfully",
                            "order": OrderSerializer(order).data
                        },
                        status=status.HTTP_201_CREATED
                    )
            except Exception as e:
                logger.error(f"Error saving order: {str(e)}")
                return Response(
                    {"error": f"Error saving order: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            logger.error(f"Error in create: {str(e)}")
            return Response(
                {
                    "error": "Failed to create order",
                    "detail": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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


@api_view(['POST'])
def verify_payment(request, order_id):
    try:
        # Get the order first
        order = Order.objects.get(id=order_id)
        
        # Get the Paystack reference from the request body
        paystack_ref = request.data.get('paystackRef')
        if not paystack_ref:
            return Response({
                'status': 'failed', 
                'error': 'Paystack reference is required'
            }, status=400)

        order.paystack_reference = paystack_ref
        order.save()

        url = f'https://api.paystack.co/transaction/verify/{paystack_ref}'
        headers = {
            'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}',
            'Content-Type': 'application/json',
        }
        
        logger.info(f"Verifying payment for order {order_id} with reference {paystack_ref}")
        response = requests.get(url, headers=headers)
        logger.debug(f"Paystack response: {response.content}")
        
        if response.status_code != 200:
            return Response({
                'status': 'failed', 
                'error': 'Failed to verify payment with Paystack'
            }, status=response.status_code)
        
        data = response.json()
        
        if data.get('status') and data['data'].get('status') == 'success':
            amount_paid = Decimal(str(data['data'].get('amount', 0))) / Decimal('100')
            order_total = Decimal(str(order.total))

            if abs(amount_paid - order_total) > Decimal('0.01'):
                logger.error(f"Amount mismatch: paid={amount_paid}, order={order_total}")
                return Response({
                    'status': 'failed',
                    'error': 'Payment amount does not match order amount'
                }, status=400)

            order.status = 'confirmed'
            order.paid = True
            order.save()
            
            logger.info(f"Payment verified successfully for order {order_id}")
            return Response({'status': 'success'})
            
        return Response({
            'status': 'failed', 
            'error': 'Payment verification failed'
        })
        
    except Order.DoesNotExist:
        return Response({
            'status': 'failed', 
            'error': 'Order not found'
        }, status=404)
    except Exception as e:
        logger.error(f"Error in verify_payment: {str(e)}")
        return Response({
            'status': 'failed', 
            'error': str(e)
        }, status=500)


@api_view(['POST'])
def create_order(request):
    print("Incoming order data:", request.data)  # Debug print
    
    serializer = OrderSerializer(data=request.data)
    if serializer.is_valid():
        try:
            order = serializer.save()
            return Response({
                'status': 'success',
                'order': OrderSerializer(order).data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    print("Validation errors:", serializer.errors)  # Debug print
    return Response({
        'status': 'error',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


