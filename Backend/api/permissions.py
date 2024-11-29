from rest_framework import permissions


class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        # Allow read-only access for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Write operations only for managers and superusers
        return (request.user and request.user.is_authenticated and 
                (request.user.groups.filter(name="Managers").exists() or 
                 request.user.is_superuser))


class IsDeliveryCrew(permissions.BasePermission):
    def has_permission(self, request, view):
        # Allow read-only access for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Write operations only for delivery crew and superusers
        return (request.user and request.user.is_authenticated and 
                (request.user.groups.filter(name="Crew").exists() or 
                 request.user.is_superuser))


class IsCustomer(permissions.BasePermission):
    def has_permission(self, request, view):
        return (request.user and request.user.is_authenticated and 
                not request.user.groups.filter(name__in=["Managers", "Crew"]).exists())
