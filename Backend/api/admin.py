from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from .models import User, MenuItem, Category, Cart, CartItem, Order, OrderItem, Table, TableBooking

class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'is_staff', 'get_groups')
    list_filter = ('is_staff', 'is_superuser', 'groups')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {
            'fields': (
                'is_active',
                'is_staff',
                'is_superuser',
                'groups',
                'user_permissions',
            ),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name'),
        }),
    )

    def get_groups(self, obj):
        return ", ".join([group.name for group in obj.groups.all()])
    get_groups.short_description = 'Groups'

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        if not change:  # Only for newly created users
            customers_group = Group.objects.get_or_create(name='Customers')[0]
            obj.groups.add(customers_group)

class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'category', 'featured']
    list_filter = ['category', 'featured']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}

class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name']
    prepopulated_fields = {'slug': ('name',)}

class CartItemInline(admin.TabularInline):
    model = CartItem
    fields = ['menuitem', 'quantity', 'price']
    readonly_fields = ['price']
    extra = 1

class CartAdmin(admin.ModelAdmin):
    list_display = ['customer', 'created']
    inlines = [CartItemInline]

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1

class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'paid', 'status', 'total', 'created']
    list_filter = ['status', 'delivery_type', 'created']
    search_fields = ['customer__email', 'delivery_crew__email']
    inlines = [OrderItemInline]

class TableAdmin(admin.ModelAdmin):
    list_display = ['table_number', 'capacity', 'is_active']
    list_filter = ['is_active', 'capacity']
    search_fields = ['table_number']

class TableBookingAdmin(admin.ModelAdmin):
    list_display = ['customer', 'table', 'booking_date', 'booking_time', 'status']
    list_filter = ['status', 'booking_date']
    search_fields = ['customer__email', 'table__table_number']


# Register models
admin.site.register(User, CustomUserAdmin)
admin.site.register(MenuItem, MenuItemAdmin)
admin.site.register(Category, CategoryAdmin)
admin.site.register(Cart, CartAdmin)
admin.site.register(Order, OrderAdmin)
admin.site.register(Table, TableAdmin)
admin.site.register(TableBooking, TableBookingAdmin)

