/**
 * Test file for the wrap concept API
 * This is a utility for local testing; not meant to be called from the API
 */

import { generateWrapConcept } from '@/lib/wrap-concept-client';

export async function testWrapConceptAPI() {
  const testParams = {
    vehicleType: 'van',
    designDirection:
      'Modern, minimalist design with geometric patterns. Use company colors blue and white. Include the logo prominently on the side.',
    companyName: 'TechFlow Solutions',
    contactEmail: 'design@techflow.com',
    revisionNotes: 'Make it more vibrant and add more brand personality',
  };

  console.log('Testing Wrap Concept API with params:', testParams);

  try {
    const result = await generateWrapConcept(
      testParams,
      'http://localhost:3000' // Local dev URL
    );

    console.log('✅ API Response:', result);
    console.log('📸 Image URL:', result.data.imageUrl);
    console.log('📝 Title:', result.data.conceptTitle);
    console.log('💡 Rationale:', result.data.creativRationale);

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
