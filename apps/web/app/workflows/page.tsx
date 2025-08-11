'use client';

import { useState, useEffect } from 'react';

interface Automation {
  id: string;
  name: string;
  enabled: boolean;
  backend: string;
  createdAt: string;
}

export default function WorkflowsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    spec: '',
  });

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      const response = await fetch('/api/workflows');
      if (response.ok) {
        const data = await response.json();
        setAutomations(data.automations);
      }
    } catch (error) {
      console.error('Failed to fetch automations:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const spec = JSON.parse(newWorkflow.spec);
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWorkflow.name,
          spec,
        }),
      });
      if (response.ok) {
        await fetchAutomations();
        setShowCreateForm(false);
        setNewWorkflow({ name: '', spec: '' });
      }
    } catch (error) {
      console.error('Failed to create workflow:', error);
    }
  };

  const toggleWorkflow = async (id: string, enabled: boolean) => {
    try {
      const endpoint = enabled ? 'disable' : 'enable';
      const response = await fetch(`/api/workflows/${id}/${endpoint}`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchAutomations();
      }
    } catch (error) {
      console.error('Failed to toggle workflow:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Workflow
          </button>
        </div>

        <div className="grid gap-4">
          {automations.map(automation => (
            <div key={automation.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {automation.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Backend: {automation.backend}
                  </p>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(automation.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      automation.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {automation.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => toggleWorkflow(automation.id, automation.enabled)}
                    className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {automation.enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-xl font-bold mb-4">Create New Workflow</h2>
              <form onSubmit={handleCreate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workflow Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={newWorkflow.name}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workflow Spec (JSON)
                  </label>
                  <textarea
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    value={newWorkflow.spec}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, spec: e.target.value })}
                    placeholder={JSON.stringify({
                      nodes: [],
                      edges: [],
                      triggers: []
                    }, null, 2)}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}