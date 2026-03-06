# Payment Integration Setup Guide

This guide will help you set up Razorpay integration and split bill functionality for the Brew & Bites cafe application.

## 🚀 Quick Setup

### 1. Environment Configuration

1. Copy the environment file:
```bash
cp .env.example .env
```

2. Get your Razorpay credentials:
   - Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
   - Go to Settings → API Keys
   - Generate a new key pair (Test mode for development)

3. Add your credentials to `.env`:
```env
VITE_RAZORPAY_KEY_ID=your_test_key_id_here
VITE_RAZORPAY_KEY_SECRET=your_test_key_secret_here
VITE_API_URL=http://localhost:5001
NODE_ENV=development
```

### 2. Features Available

#### 💳 Payment Methods
- **Online Payment**: Razorpay integration (Credit/Debit cards, UPI, Net Banking, Wallets)
- **Cash Payment**: Mark orders as paid manually

#### 🧾 Split Bill Options
- **Full Payment**: One person pays the entire bill
- **Split by Items**: Assign specific items to different people
- **Custom Split**: Divide by percentage or custom amounts

#### 📱 Customer Experience
- Customers can pay directly from their table
- No need to wait for staff to process payments
- Instant payment confirmation
- Receipt generation

## 🔧 How It Works

### For Customers:
1. Order food through the customer interface
2. When the order is complete, click "Pay Now"
3. Choose payment method (Online/Cash)
4. For split bills:
   - Select "Split Bill" option
   - Choose split type (Items/Custom)
   - Assign items to people or set percentages
5. Complete payment

### For Staff:
1. View payment status in admin dashboard
2. See real-time payment updates
3. Generate receipts
4. Track order completion

## 🎯 Demo Mode

For testing without actual payments:
- Use test credentials from Razorpay
- Test card numbers are available in Razorpay documentation
- Or use "Cash Payment" option to simulate payments

## 🔒 Security Notes

- Never expose your Razorpay Key Secret in frontend code
- Use test mode for development
- Switch to production keys before going live
- All payment processing happens through secure Razorpay servers

## 🐛 Troubleshooting

### Payment Modal Not Opening
- Check if PaymentModal component is properly imported
- Verify receipt data structure
- Check browser console for errors

### Razorpay Not Loading
- Verify Razorpay key ID is correct
- Check internet connection
- Ensure Razorpay script can load

### Split Bill Issues
- Check item ID consistency (id/itemId/_id)
- Verify person assignments
- Check tax calculations

## 📞 Support

For issues with:
- Razorpay integration: Contact Razorpay support
- Application bugs: Check application logs
- Payment disputes: Use Razorpay dashboard

---

**Next Steps:**
1. Set up your Razorpay account
2. Configure environment variables
3. Test with small amounts
4. Go live with production keys
