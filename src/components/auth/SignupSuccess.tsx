
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail } from 'lucide-react';

interface SignupSuccessProps {
  onBackToLogin: () => void;
}

export function SignupSuccess({ onBackToLogin }: SignupSuccessProps) {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <CardTitle className="text-green-800">Account Created Successfully!</CardTitle>
        <CardDescription>
          Welcome to the GM Staff Portal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="flex items-start space-x-3">
            <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Check Your Email</h4>
              <p className="text-sm text-blue-600 mt-1">
                We've sent you a confirmation email. Please check your inbox and click the verification link to activate your account.
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-center text-sm text-gm-neutral-600">
          <p>Already verified your email?</p>
        </div>
        
        <Button
          onClick={onBackToLogin}
          className="w-full bg-gm-primary-500 hover:bg-gm-primary-600"
        >
          Back to Login
        </Button>
      </CardContent>
    </Card>
  );
}
