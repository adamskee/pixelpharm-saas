// Script to create Joel Gauvin user with Pro subscription
const fetch = require('node-fetch');

async function createJoelUser() {
  try {
    const response = await fetch('https://pixelpharm.com/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin_token_super_admin'
      },
      body: JSON.stringify({
        email: 'tribalcollective@gmail.com',
        firstName: 'Joel',
        lastName: 'Gauvin',
        password: 'PixelPharm2025!',
        subscriptionPlan: 'pro',
        subscriptionDays: 365 // 1 year
      })
    });

    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', result);

    if (response.ok) {
      const data = JSON.parse(result);
      console.log('\n✅ User created successfully!');
      console.log('📧 Email:', data.user.email);
      console.log('👤 Name:', data.user.firstName, data.user.lastName);
      console.log('🔑 Password:', data.credentials.password);
      console.log('💎 Subscription:', data.user.subscriptionPlan);
      console.log('📅 Expires:', data.user.subscriptionExpiresAt);
      console.log('🆔 User ID:', data.user.userId);
    } else {
      console.error('❌ Failed to create user:', result);
    }
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
  }
}

createJoelUser();