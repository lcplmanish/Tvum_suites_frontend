import React from 'react';
import AIChatbot from '@/components/AIChatbot';

const AIChatbotPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">AI Hotel Assistant</h1>
        <p className="text-muted-foreground">
          Ask questions about bookings, rooms, inventory, and more.
        </p>
      </div>
      <AIChatbot />
    </div>
  );
};

export default AIChatbotPage;