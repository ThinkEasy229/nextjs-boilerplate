/**
 * Test file for the wrap concept API
 * This is a utility for local testing; not meant to be called from the API
 */

import { generateWrapConcept } from '@/lib/wrap-concept-client';

export async function testWrapConceptAPI() {
  const testParams = {
    vehicleType: 'cargo-van',
    vehicleYear: '2024',
    vehicleMake: 'Ford',
    vehicleModel: 'Transit',
    designDirection: 'Modern, minimalist design with geometric patterns and strong roadside readability.',
    companyName: 'TechFlow Solutions',
    contactEmail: 'design@techflow.com',
    industry: 'Commercial HVAC',
    preferredColors: 'Blue, white, silver',
    goals: 'Make it feel premium enough to support a premium upsell.',
    tagline: 'Fast comfort. Trusted crews.',
  };

  console.log('Testing Wrap Concept API with params:', testParams);

  try {
    const result = await generateWrapConcept(
      testParams,
      'http://localhost:3000' // Local dev URL
    );

    console.log('✅ API Response:', result);
    console.log('🧾 Session ID:', result.data.sessionId);
    console.log('🚐 Vehicle:', result.data.selectedVehicle.label);
    console.log('🖼️ Image URL:', result.data.imageUrl);
    console.log('💡 Direction 1:', result.data.creativeDirectionOne);

    return result;
  } catch (error) {
    console.error('❌ API Error:', error);
    throw error;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testWrapConceptAPI();
}
