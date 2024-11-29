from rest_framework import serializers
from .models import MenuItem, Category, Cart, CartItem, Order, OrderItem, Table, TableBooking, User
from rest_framework.validators import UniqueTogetherValidator, UniqueValidator
from django.contrib.auth import get_user_model
import bleach
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer
from djoser.serializers import UserSerializer as BaseUserSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role')
        read_only_fields = ('id', 'role')

    def get_role(self, obj):
        if obj.groups.filter(name='Managers').exists():
            return 'manager'
        if obj.groups.filter(name='Crew').exists():
            return 'delivery'
        return 'customer'


class UserCreateSerializer(BaseUserCreateSerializer):
    class Meta(BaseUserCreateSerializer.Meta):
        model = User
        fields = ('id', 'email', 'password', 're_password', 'first_name', 'last_name')
        read_only_fields = ('id',)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]
        extra_kwargs = {
            "slug": {"read_only": True},
        }

    def validate(self, attrs):
        attrs["name"] = bleach.clean(attrs["name"])
        return super().validate(attrs)


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.StringRelatedField(
        source="category", read_only=True, many=False
    )
    image = serializers.ImageField()

    class Meta:
        model = MenuItem
        fields = [
            "id",
            "name",
            "slug",
            "price",
            "featured",
            "category",
            "category_name",
            "description",
            "image",
        ]
        extra_kwargs = {
            "slug": {"read_only": True},
        }

    def validate(self, attrs):
        if attrs["price"] < 0:
            raise serializers.ValidationError("Price cannot be negative")
        attrs["name"] = bleach.clean(attrs["name"])
        if "description" in attrs:
            attrs["description"] = bleach.clean(attrs["description"])
        return super().validate(attrs)


class CartItemSerializer(serializers.ModelSerializer):
    item_name = serializers.StringRelatedField(
        source="menuitem", read_only=True, many=False
    )

    class Meta:
        model = CartItem
        fields = ["id", "menuitem", "item_name", "quantity", "unit_price", "price"]
        extra_kwargs = {
            "quantity": {"min_value": 1},
            "unit_price": {"read_only": True},
            "price": {"read_only": True},
        }

    def validate(self, attrs):
        if attrs["quantity"] < 0:
            raise serializers.ValidationError("quantity cannot be negative")
        return super().validate(attrs)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ["customer", "items"]


class OrderItemSerializer(serializers.ModelSerializer):
    item_name = serializers.StringRelatedField(
        source="menuitem", read_only=True, many=False
    )

    class Meta:
        model = OrderItem
        fields = ["id", "menuitem", "item_name", "quantity", "price", "total_cost"]


class OrderSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    subtotal = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )

    class Meta:
        model = Order
        fields = [
            'id', 'customer', 'delivery_crew', 'status',
            'total', 'subtotal', 'discount', 'delivery_type',
            'table_booking', 'created', 'updated'
        ]
        read_only_fields = ['customer', 'total', 'subtotal']

    def validate(self, data):
        if 'delivery_type' in data:
            if data['delivery_type'] == 'dine_in' and 'table_booking' not in data:
                raise serializers.ValidationError(
                    {"table_booking": "Table booking is required for dine-in orders"}
                )
        return data


class CustomOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer = UserSerializer(read_only=True)
    delivery_crew = UserSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "customer",
            "delivery_crew",
            "created",
            "updated",
            "paid",
            "status",
            "discount",
            "subtotal",
            "total",
            "items",
        ]

        extra_kwargs = {
            "paid": {"read_only": True},
            "created": {"read_only": True},
            "updated": {"read_only": True},
            "discount": {"read_only": True},
            "subtotal": {"read_only": True},
            "total": {"read_only": True},
            "status": {"read_only": True},
        }


class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = ['id', 'table_number', 'capacity', 'is_active']


class TableBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableBooking
        fields = [
            'id', 'customer', 'table', 'booking_date', 'booking_time',
            'number_of_guests', 'status', 'special_requests'
        ]
        read_only_fields = ['customer']

    def validate(self, data):
        # Fix: Check if table exists in partial updates
        table = data.get('table', self.instance.table if self.instance else None)
        guests = data.get('number_of_guests', self.instance.number_of_guests if self.instance else None)
        
        if table and guests and guests > table.capacity:
            raise serializers.ValidationError(
                "Number of guests exceeds table capacity"
            )
        return data
