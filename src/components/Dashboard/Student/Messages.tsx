'use client';

import React from 'react';
import { MessageSquare, Send, Search, Users } from 'lucide-react';

export default function Messages() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            Messages
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Send and receive messages with your network. Coming soon.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations list */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white border rounded-xl p-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations (coming soon)"
                className="w-full pl-9 pr-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              />
            </div>
          </div>

          <div className="bg-white border rounded-xl">
            <div className="p-3 border-b">
              <h3 className="text-sm font-semibold text-gray-900">Conversations</h3>
            </div>
            <div className="p-3 space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-default">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-24 bg-gray-100 rounded mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Message thread */}
        <div className="lg:col-span-2 bg-white border rounded-xl flex flex-col min-h-[480px]">
          <div className="p-4 border-b flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500" />
            <div>
              <div className="h-4 w-40 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded mt-1" />
            </div>
          </div>

          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${i % 2 === 0 ? 'bg-gray-100 text-gray-800' : 'bg-blue-600 text-white'}`}>
                  This is a placeholder message bubble.
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t">
            <form className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a message... (coming soon)"
                className="flex-1 px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              />
              <button
                type="button"
                className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-blue-600 text-white text-sm disabled:opacity-50"
                disabled
                title="Send"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 px-3 py-2 rounded-md border text-sm text-gray-700 disabled:opacity-60"
                disabled
                title="Start new chat"
              >
                <Users className="w-4 h-4" />
                New Chat
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 text-blue-800 border border-blue-100 rounded-xl p-4 text-sm">
        Messaging and connections will be enabled soon. This is the initial scaffold.
      </div>
    </div>
  );
}
