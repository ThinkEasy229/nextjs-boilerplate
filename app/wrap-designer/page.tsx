'use client';

import { useState } from 'react';
import Image from 'next/image';

type FormData = {
  vehicleType: string;
  designDirection: string;
  companyName: string;
  contactEmail: string;
};

type GeneratedDesign = {
  imageUrl: string;
  conceptTitle: string;
  creativeRationale: string;
};

export default function WrapDesigner() {
  const [formData, setFormData] = useState<FormData>({
    vehicleType: 'van',
    designDirection: 'modern minimalist',
    companyName: '',
    contactEmail: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [design, setDesign] = useState<GeneratedDesign | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setDesign(null);

    try {
      // Validate all fields
      if (
        !formData.vehicleType ||
        !formData.designDirection ||
        !formData.companyName ||
        !formData.contactEmail
      ) {
        throw new Error('Please fill in all fields');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contactEmail)) {
        throw new Error('Please enter a valid email address');
      }

      const response = await fetch('/api/wrap-concept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate design');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setDesign(data.data);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero Section */}
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Vehicle Wrap Designer
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Generate professional vehicle wrap designs powered by AI in seconds
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50">
            <h2 className="text-2xl font-bold mb-6">Design Brief</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-200">
                  Vehicle Type
                </label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <option value="van">Van</option>
                  <option value="truck">Truck</option>
                  <option value="car">Car</option>
                  <option value="bus">Bus</option>
                  <option value="trailer">Trailer</option>
                  <option value="suv">SUV</option>
                </select>
              </div>

              {/* Design Direction */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-200">
                  Design Direction
                </label>
                <input
                  type="text"
                  name="designDirection"
                  value={formData.designDirection}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="e.g., modern minimalist, bold geometric, vibrant gradient"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                />
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-200">
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Your company name"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                />
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-200">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-900/20 border border-red-700/30 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating Design...
                  </>
                ) : (
                  '✨ Generate Design'
                )}
              </button>
            </form>
          </div>

          {/* Results Section */}
          <div className="flex flex-col">
            {!design && !loading && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50 h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎨</div>
                  <p className="text-slate-400">
                    Fill in your design brief and click "Generate Design" to see your
                    AI-powered vehicle wrap concept.
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50 h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-slate-300 font-medium">
                    Creating your design concept...
                  </p>
                  <p className="text-slate-500 text-sm mt-2">This may take a few seconds</p>
                </div>
              </div>
            )}

            {design && (
              <div className="space-y-6">
                {/* Image */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50">
                  {design.imageUrl && (
                    <div className="relative w-full aspect-square">
                      <Image
                        src={design.imageUrl}
                        alt="Generated wrap design"
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                  )}
                </div>

                {/* Concept Details */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                  <h3 className="text-xl font-bold mb-3 text-cyan-400">
                    {design.conceptTitle}
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    {design.creativeRationale}
                  </p>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => setDesign(null)}
                  className="w-full py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition"
                >
                  Generate Another Design
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
