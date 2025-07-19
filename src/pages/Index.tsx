
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { userProfile } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${userProfile?.first_name || 'User'}!`}
        description="Price Index Management System Dashboard"
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-medium mb-2">Quick Stats</h3>
          <p className="text-sm text-muted-foreground">
            Dashboard metrics and quick statistics will appear here.
          </p>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-medium mb-2">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">
            Recent system activity and updates will be shown here.
          </p>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-medium mb-2">System Status</h3>
          <p className="text-sm text-muted-foreground">
            Current system status and health indicators.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[200px] border border-dashed rounded-lg">
        <div className="text-center">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Dashboard Content
          </h3>
          <p className="text-sm text-muted-foreground">
            Role: {userProfile?.role.replace('_', ' ')}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Dashboard widgets and analytics coming in Phase 3
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
