export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Health check
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok', 
      message: 'Vehicle Wrap Concept API is live',
      endpoint: '/api/wrap-concept'
    });
  }

  if (req.method === 'POST') {
    try {
      const { vehicleType, designDirection, companyName, contactEmail } = req.body;

      // Validate required fields
      if (!vehicleType || !designDirection || !companyName || !contactEmail) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing required fields: vehicleType, designDirection, companyName, contactEmail' 
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid email address' 
        });
      }

      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        console.error('OpenAI API key not configured');
        return res.status(500).json({ 
          success: false,
          error: 'API configuration error' 
        });
      }

      // Generate creative prompt for DALL-E
      const designPrompt = `Create a professional vehicle wrap design concept for a ${vehicleType} with the following specifications:
- Company/Brand: ${companyName}
- Design Direction: ${designDirection}
- Style: Modern, professional, eye-catching
- Include company branding and contact information
- Suitable for commercial use
- High quality, photorealistic rendering
Format: Professional mockup on a ${vehicleType}`;

      // Call OpenAI API to generate image
      const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: designPrompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          model: 'dall-e-3',
        }),
      });

      if (!imageResponse.ok) {
        const errorData = await imageResponse.json();
        console.error('OpenAI API error:', errorData);
        return res.status(500).json({ 
          success: false,
          error: 'Failed to generate image',
          details: errorData.error?.message || 'Unknown error'
        });
      }

      const imageData = await imageResponse.json();
      const imageUrl = imageData.data[0]?.url;

      if (!imageUrl) {
        return res.status(500).json({ 
          success: false,
          error: 'No image URL returned from API' 
        });
      }

      // Generate creative title and rationale
      const conceptTitle = `${companyName} ${vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)} Wrap - Premium Design Concept`;
      
      const creativeRationale = `This vehicle wrap concept delivers a bold, professional presence for ${companyName}'s ${vehicleType}. The design incorporates your brand identity with modern aesthetics, ensuring maximum visibility and brand recall on the road. The layout optimizes both front and side visibility while maintaining design coherence across the entire vehicle surface.`;

      return res.status(200).json({
        success: true,
        data: {
          imageUrl: imageUrl,
          conceptTitle: conceptTitle,
          creativeRationale: creativeRationale,
        },
        metadata: {
          vehicleType: vehicleType,
          companyName: companyName,
          generatedAt: new Date().toISOString(),
        },
      });

    } catch (error) {
      console.error('Wrap concept API error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
