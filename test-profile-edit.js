// Test script to verify profile edit functionality
const testProfileUpdate = async () => {
  const testData = {
    bio: "Updated bio for testing profile edit functionality",
    contactInfo: "Updated contact information",
    phoneNumber: "+1-555-0123",
    alternateEmail: "test.alternate@example.com"
  };

  try {
    // Simulate profile update
    console.log('Testing profile update with data:', testData);
    
    // This would normally call the API
    const response = await fetch('/v1/profile/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
      },
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      const updatedProfile = await response.json();
      console.log('Profile updated successfully:', updatedProfile);
      return updatedProfile;
    } else {
      console.error('Profile update failed:', response.status, response.statusText);
      const errorData = await response.text();
      console.error('Error details:', errorData);
    }
  } catch (error) {
    console.error('Network error during profile update:', error);
  }
};

// Test the function
testProfileUpdate();
