'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingIssuePage() {
  const router = useRouter();
  const [issue, setIssue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue }),
      });

      if (response.ok) {
        router.push('/email');
      }
    } catch (error) {
      console.error('Planning failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Chameleon.ai
          </h1>
          <p className="text-gray-600 mb-8">
            Tell us about your automation needs, and we'll set everything up for you.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="issue" className="block text-sm font-medium text-gray-700 mb-2">
                What's your issue?
              </label>
              <textarea
                id="issue"
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="I'm a realtor and I need to automate responses to property inquiry emails..."
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !issue.trim()}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Setting up your workspace...' : 'Get Started'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Example scenarios:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Automate email responses for customer inquiries</li>
              <li>• Set up CRM workflows for lead management</li>
              <li>• Create follow-up sequences for sales outreach</li>
              <li>• Build approval workflows for document processing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}