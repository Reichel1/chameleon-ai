'use client';

import { useState, useEffect } from 'react';

interface Thread {
  id: string;
  subject: string;
  lastMessageAt: string;
  status: string;
}

interface Message {
  id: string;
  direction: string;
  text: string;
  html: string;
  status: string;
  createdAt: string;
}

export default function EmailPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draftMessage, setDraftMessage] = useState<Message | null>(null);

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread);
    }
  }, [selectedThread]);

  const fetchThreads = async () => {
    try {
      const response = await fetch('/api/email/threads');
      if (response.ok) {
        const data = await response.json();
        setThreads(data.threads);
      }
    } catch (error) {
      console.error('Failed to fetch threads:', error);
    }
  };

  const fetchMessages = async (threadId: string) => {
    try {
      const response = await fetch(`/api/email/threads/${threadId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        const draft = data.messages.find((m: Message) => m.status === 'draft');
        setDraftMessage(draft || null);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleApprove = async () => {
    if (!draftMessage) return;

    try {
      const response = await fetch(`/api/email/messages/${draftMessage.id}/approve`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchMessages(selectedThread!);
      }
    } catch (error) {
      console.error('Failed to approve message:', error);
    }
  };

  const handleSend = async () => {
    if (!draftMessage) return;

    try {
      const response = await fetch(`/api/email/messages/${draftMessage.id}/send`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchMessages(selectedThread!);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-80 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Email Threads</h2>
        </div>
        <div className="overflow-y-auto">
          {threads.map(thread => (
            <div
              key={thread.id}
              onClick={() => setSelectedThread(thread.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedThread === thread.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="font-medium text-gray-900 truncate">
                {thread.subject || 'No subject'}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {new Date(thread.lastMessageAt).toLocaleDateString()}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Status: {thread.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedThread ? (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`mb-4 p-4 rounded-lg ${
                    message.direction === 'inbound'
                      ? 'bg-gray-100 mr-12'
                      : 'bg-blue-100 ml-12'
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-2">
                    {message.direction === 'inbound' ? 'Received' : 'Sent'} •{' '}
                    {new Date(message.createdAt).toLocaleString()}
                  </div>
                  <div className="text-gray-900">
                    {message.text || 'No content'}
                  </div>
                  {message.status === 'draft' && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <span className="text-xs text-amber-600 font-medium">
                        DRAFT - Pending approval
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {draftMessage && (
              <div className="p-6 bg-white border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Draft Reply</h3>
                  <div className="space-x-2">
                    <button
                      onClick={handleApprove}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={handleSend}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Send
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  {draftMessage.text}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a thread to view messages
          </div>
        )}
      </div>
    </div>
  );
}