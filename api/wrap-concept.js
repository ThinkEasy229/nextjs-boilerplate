export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', message: 'API is live' });
  }
  
  if (req.method === 'POST') {
    const { vehicleType, designDirection, companyName, contactEmail } = req.body;
    
    if (!vehicleType || !designDirection || !companyName || !contactEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    return res.status(200).json({
      success: true,
      data: {
        conceptTitle: `${companyName} ${vehicleType} Wrap`,
        creativeRationale: 'Vehicle wrap concept generated successfully',
      },
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
