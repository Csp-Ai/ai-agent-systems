import React from 'react';

export default function AgentSubmissionSuccess() {
  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">Submission Received</h1>
      <p>Your agent was uploaded and is pending review.</p>
      <a href="/submit-agent" className="text-blue-400 underline">Submit another</a>
    </div>
  );
}
