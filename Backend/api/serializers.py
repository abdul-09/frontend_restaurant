from rest_framework import serializers
from .models import MenuItem, Category, Cart, CartItem, Order, OrderItem, Table, TableBooking, User
from rest_framework.validators import UniqueTogetherValidator, UniqueValidator
from django.contrib.auth import get_user_model
from django.conf import settings
import bleach
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer
from djoser.serializers import UserSerializer as BaseUserSerializer
from .utils import generate_unique_order_reference

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
    name = serializers.CharField(source='menuitem.name', read_only=True)  # Add this line
    # subtotal = serializers.SerializerMethodField()

    
    class Meta:
        model = CartItem
        fields = [
            "id", 
            "menuitem", 
            "name",  # Include name in fields
            "quantity", 
            "price", 
            # "subtotal",
            
        ]
        extra_kwargs = {
            "quantity": {"min_value": 1},
            "price": {"read_only": True},
            "id": {"read_only": True},
        }
    # def get_total_price(self, obj):
    #     return obj.price * obj.quantity

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
    id = serializers.IntegerField(source='pk', read_only=True)
    name = serializers.CharField(source='menuitem.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'menuitem', 'quantity', 'price', 'specialInstructions']


class DeliveryInfoSerializer(serializers.Serializer):
    type = serializers.CharField()
    address = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    contactNumber = serializers.CharField()
    instructions = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    preferredTime = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    delivery = DeliveryInfoSerializer(write_only=True)
    customer = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all()
    )
    reference = serializers.CharField(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'customer', 'items', 'status',
            'subtotal', 'tax', 'deliveryFee', 'total',
            'paymentMethod', 'delivery', 'reference',
            'created', 'updated'
        ]
        read_only_fields = ['reference', 'created', 'updated']

    def validate(self, data):
        print("Validating data:", data)
            
        if self.instance:  # Indicates this is an update
                return data
            
            # Ensure all required fields are present for create requests
        required_fields = ['customer', 'items', 'subtotal', 'tax', 'deliveryFee', 'total', 'paymentMethod', 'delivery']
        for field in required_fields:
            if field not in data:
                    raise serializers.ValidationError({field: f"{field} is required"})
            
            # Validate delivery data
        delivery_data = data.get('delivery', {})
        if delivery_data.get('type') == 'delivery' and not delivery_data.get('address'):
                raise serializers.ValidationError({'delivery': 'Address is required for delivery orders'})
            
            # Validate items
        if not data.get('items'):
                raise serializers.ValidationError({'items': 'At least one item is required'})
            
        return data


    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Represent customer as primary key
        representation['customer'] = {
        'id': instance.customer.id,
        'email': instance.customer.email,
        'username': instance.customer.username,
        'firstName': instance.customer.first_name,
        'lastName': instance.customer.last_name,
    }
        representation['delivery'] = {
            'type': instance.delivery_type,
            'address': instance.delivery_address or '',
            'contactNumber': instance.contact_number,
            'instructions': instance.delivery_instructions or '',
            'preferredTime': instance.preferred_time or ''
        }
        return representation

    def create(self, validated_data):
        print("Creating order with data:", validated_data)
        items_data = validated_data.pop('items')
        delivery_data = validated_data.pop('delivery')
        

        # Generate a unique reference
        reference = generate_unique_order_reference()
        while Order.objects.filter(reference=reference).exists():
            reference = generate_unique_order_reference()

        # Create the order
        order = Order.objects.create(
            reference=reference,
            delivery_type=delivery_data['type'],
            delivery_address=delivery_data.get('address'),
            contact_number=delivery_data['contactNumber'],
            delivery_instructions=delivery_data.get('instructions'),
            preferred_time=delivery_data.get('preferredTime'),
            **validated_data
        )

        print("Order created:", order)

        # Create order items
        for item_data in items_data:
            OrderItem.objects.create(
                order=order,
                **item_data
            )

        return order


class CustomOrderSerializer(OrderSerializer):
    class Meta(OrderSerializer.Meta):
        fields = [
            'id', 'customer', 'items', 'status',
            'subtotal', 'tax', 'deliveryFee', 'total',
            'paymentMethod', 'delivery', 'reference',
            'created', 'updated', 'paid'
        ]


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
