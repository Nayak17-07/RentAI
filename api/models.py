import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_num = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=50, blank=True)
    # username, email, password are included in AbstractUser

class Appliance(models.Model):
    appliance_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category_id = models.CharField(max_length=100)
    rental_name = models.CharField(max_length=255)
    daily_price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.IntegerField(default=0)

    def __str__(self):
        return self.rental_name

class Rental(models.Model):
    rental_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rentals')
    appliance = models.ForeignKey(Appliance, on_delete=models.CASCADE, related_name='rentals')
    rental_start_date = models.DateField(auto_now_add=True)
    rental_end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=50, default='ACTIVE')

class PaymentReturn(models.Model):
    payment_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rental = models.ForeignKey(Rental, on_delete=models.CASCADE, related_name='payments')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=50, blank=True)
    return_status = models.CharField(max_length=50, blank=True)

class UserChurnScore(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name='churn_score')
    churn_risk_score = models.DecimalField(max_digits=5, decimal_places=4)
    shap_reason = models.TextField(blank=True, null=True)
    last_updated = models.DateTimeField(auto_now=True)

class ApplianceRecommendation(models.Model):
    recommendation_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recommendations')
    recommended_appliance = models.ForeignKey(Appliance, on_delete=models.CASCADE)
    last_updated = models.DateTimeField(auto_now=True)
