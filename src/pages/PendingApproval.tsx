import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Mail, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function PendingApproval() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Account Pending Approval</CardTitle>
          <CardDescription>
            Your account has been created successfully but requires administrator approval before you can access the system.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              We've notified your organization administrators about your registration request. You'll receive an email notification once your account is approved.
            </AlertDescription>
          </Alert>
          
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Account:</strong> {user?.email}</p>
            <p><strong>Status:</strong> Pending approval</p>
          </div>
          
          <div className="space-y-3">
            <div className="text-sm">
              <p className="font-medium mb-1">Need help?</p>
              <p className="text-muted-foreground">
                If you have questions about your account approval, please contact your organization administrator or IT support team.
              </p>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={logout}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}