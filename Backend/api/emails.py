# api/emails.py
from djoser import email

class PasswordResetEmail(email.PasswordResetEmail):
    template_name = "email/password_reset_email.html"
  
