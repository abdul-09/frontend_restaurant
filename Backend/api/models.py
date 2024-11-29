from django.db import models
from django.contrib.auth.models import User, AbstractUser, BaseUserManager
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.conf import settings

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, username=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True, blank=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = CustomUserManager()

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)

    @property
    def role(self):
        """Return the user's role based on their group"""

        if self.groups.filter(name='Managers').exists():
            return 'manager'
        if self.groups.filter(name='Crew').exists():
            return 'delivery'
        return 'customer'

class Category(models.Model):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True, blank=True)

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["name"])]
        verbose_name = "category"
        verbose_name_plural = "categories"

    def save(self, *args, **kwargs):
        self.slug = slugify(self.name)
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class MenuItem(models.Model):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    featured = models.BooleanField(default=True)
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="menu_items"
    )
    description = models.CharField(max_length=255, blank=True)
    image = models.ImageField(blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("name",)
        indexes = [
            models.Index(fields=["id", "slug"]),
            models.Index(fields=["name"]),
            models.Index(fields=["-created"]),
        ]

    def save(self, *args, **kwargs):
        self.slug = slugify(self.name)
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name


class Cart(models.Model):
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.customer.username} Cart"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    menuitem = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ("cart", "menuitem")

    def save(self, *args, **kwargs):
        if not self.unit_price:
            self.unit_price = self.menuitem.price
        self.price = self.unit_price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.menuitem.name} ({self.quantity})"

class Table(models.Model):
    table_number = models.IntegerField(unique=True)
    capacity = models.IntegerField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Table {self.table_number} (Seats {self.capacity})"

class TableBooking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    table = models.ForeignKey(Table, on_delete=models.CASCADE, related_name='bookings')
    booking_date = models.DateField()
    booking_time = models.TimeField()
    number_of_guests = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(20)]
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    special_requests = models.TextField(blank=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-booking_date', '-booking_time']
        indexes = [
            models.Index(fields=['booking_date', 'booking_time']),
            models.Index(fields=['status']),
        ]
        # Prevent double booking
        constraints = [
            models.UniqueConstraint(
                fields=['table', 'booking_date', 'booking_time'],
                name='unique_booking'
            )
        ]

    def __str__(self):
        return f"Booking for {self.customer.username} - Table {self.table.table_number}"

    def clean(self):
        if self.number_of_guests > self.table.capacity:
            raise ValidationError(
                {'number_of_guests': 'Number of guests exceeds table capacity'}
            )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

class Order(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("canceled", "Canceled"),
    ]

    DELIVERY_CHOICES = [
        ('pickup', 'Restaurant Pickup'),
        ('dine_in', 'Dine In'),
        ('delivery', 'Home Delivery'),
    ]

    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    delivery_crew = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='delivery_orders',
        null=True
    )
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    paid = models.BooleanField(default=False)
    discount = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)], default=0
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    delivery_type = models.CharField(
        max_length=20, 
        choices=DELIVERY_CHOICES,
        default='delivery'
    )
    table_booking = models.ForeignKey(
        TableBooking,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders'
    )

    class Meta:
        ordering = ["-created"]
        indexes = [models.Index(fields=["-created"])]

    @property
    def total(self):
        return sum(item.quantity * item.price for item in self.items.all())

    @property
    def subtotal(self):
        total = self.total
        if self.discount:
            discount_amount = (total * Decimal(self.discount) / Decimal(100))
            return (total - discount_amount).quantize(Decimal('0.01'))
        return total

    def get_discount_amount(self):
        if self.discount:
            return (self.total * Decimal(self.discount) / Decimal(100)).quantize(Decimal('0.01'))
        return Decimal('0.00')

    def __str__(self):
        return f"Order {self.id}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    menuitem = models.ForeignKey(
        MenuItem, related_name="order_items", on_delete=models.CASCADE
    )
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        self.price = self.menuitem.price
        return super().save(*args, **kwargs)

    def __str__(self):
        return str(self.id)

    @property
    def total_cost(self):
        return self.price * self.quantity


