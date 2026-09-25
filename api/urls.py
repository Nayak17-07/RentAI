from django.urls import path
from .views import (
    RegisterView, LoginView, ApplianceView, RecommendationView, 
    CartView, CheckoutView, RentalsView, TokenRefreshView, 
    KYCView, AdminDashboardView, PaymentHistoryView, PaymentInvoiceView
)

urlpatterns = [
    path('users/', RegisterView.as_view(), name='user_register'),
    path('token/', LoginView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('appliances/', ApplianceView.as_view(), name='appliances'),
    path('recommendations/', RecommendationView.as_view(), name='recommendations'),
    path('cart/', CartView.as_view(), name='cart'),
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    path('rentals/', RentalsView.as_view(), name='rentals'),
    path('payments/', PaymentHistoryView.as_view(), name='payment_history'),
    path('payments/<str:transaction_id>/', PaymentInvoiceView.as_view(), name='payment_invoice'),
    path('kyc/', KYCView.as_view(), name='kyc'),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin_dashboard'),
]

