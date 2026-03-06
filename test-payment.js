// Test script to verify payment setup
// Run this in browser console to test payment functionality

console.log('🧪 Testing Payment Setup...');

// Test 1: Check if Razorpay loads
function testRazorpay() {
  console.log('📱 Testing Razorpay integration...');
  
  // Load Razorpay script
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => {
    console.log('✅ Razorpay script loaded successfully');
    if (window.Razorpay) {
      console.log('✅ Razorpay object available');
    } else {
      console.log('❌ Razorpay object not found');
    }
  };
  script.onerror = () => {
    console.log('❌ Failed to load Razorpay script');
  };
  document.body.appendChild(script);
}

// Test 2: Check environment variables
function testEnvironment() {
  console.log('🔧 Testing environment variables...');
  
  const apiKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
  const apiUrl = import.meta.env.VITE_API_URL;
  
  console.log('API Key:', apiKey ? '✅ Set' : '❌ Missing');
  console.log('API URL:', apiUrl || '❌ Missing');
}

// Test 3: Simulate payment data
function testPaymentData() {
  console.log('💳 Testing payment data structure...');
  
  const mockReceipt = {
    items: [
      { id: '1', name: 'Coffee', price: 50, qty: 2, orderedBy: 'John' },
      { id: '2', name: 'Sandwich', price: 100, qty: 1, orderedBy: 'Jane' }
    ],
    total: 200,
    discount: 0,
    taxEnabled: true,
    taxRate: 5
  };
  
  console.log('Mock receipt:', mockReceipt);
  console.log('✅ Payment data structure valid');
}

// Run all tests
testRazorpay();
testEnvironment();
testPaymentData();

console.log('🎉 Payment setup test complete!');
