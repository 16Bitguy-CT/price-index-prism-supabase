
import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function ChannelManagement() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Channel Management"
        description="Manage distribution channels and their configurations"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Channel
          </Button>
        }
      />
      
      <div className="flex items-center justify-center min-h-[400px] border border-dashed rounded-lg">
        <div className="text-center">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Channel Management
          </h3>
          <p className="text-sm text-muted-foreground">
            This page will contain channel management functionality.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Coming in Phase 3: CRUD Operations
          </p>
        </div>
      </div>
    </div>
  );
}
