
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { XeroOAuthConnection } from '@/components/api/XeroOAuthConnection';

export const ApiSettings = () => {

  return (
    <div className="space-y-6">
      {/* Square Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Square Integration</CardTitle>
          <CardDescription>
            Manage your Square payment processing integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Square POS</h4>
              <p className="text-sm text-muted-foreground">Payment processing and venue management</p>
            </div>
            <Badge className="bg-green-100 text-green-800">Connected</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Xero Integration */}
      <XeroOAuthConnection />
    </div>
  );
};
