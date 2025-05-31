'use client'

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/useToast';
import { CheckCircle, AlertCircle, AlertTriangle, WifiOff, X } from 'lucide-react';

export default function TestErrorStatesPage() {
  const { toast } = useToast();
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-violet-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-blue-600 to-violet-600 bg-clip-text text-transparent mb-2">
            Error States & Feedback Components Test
          </h1>
          <p className="text-muted-foreground">Testing blue gradient theme consistency</p>
        </div>

        {/* Toast Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Toast Messages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => toast({
                  title: "Success!",
                  description: "Operation completed successfully.",
                  variant: "success",
                })}
                className="bg-gradient-to-r from-blue-600 via-violet-500 to-violet-600"
              >
                Success Toast
              </Button>
              
              <Button
                onClick={() => toast({
                  title: "Warning",
                  description: "Please review this action before proceeding.",
                  variant: "warning",
                })}
                className="bg-gradient-to-r from-violet-600 via-blue-500 to-blue-600"
              >
                Warning Toast
              </Button>
              
              <Button
                onClick={() => toast({
                  title: "Information",
                  description: "Here's some helpful information for you.",
                  variant: "info",
                })}
                className="bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600"
              >
                Info Toast
              </Button>
              
              <Button
                onClick={() => toast({
                  title: "Error",
                  description: "Something went wrong. Please try again.",
                  variant: "destructive",
                })}
                variant="destructive"
              >
                Error Toast
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alert Components */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button onClick={() => setShowSuccess(!showSuccess)} className="mr-2">
                Toggle Success Alert
              </Button>
              {showSuccess && (
                <Alert className="bg-gradient-to-br from-blue-50 via-blue-100 to-violet-50 border-blue-200 backdrop-blur-sm shadow-lg">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700">
                    This is a success message with blue gradient theme.
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={() => setShowError(!showError)} className="mr-2">
                Toggle Error Alert
              </Button>
              {showError && (
                <Alert variant="destructive" className="bg-gradient-to-br from-red-50 via-red-100 to-pink-50 border-red-200 backdrop-blur-sm shadow-lg">
                  <AlertDescription className="text-red-700">
                    This is an error message with gradient theme.
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={() => setShowWarning(!showWarning)} className="mr-2">
                Toggle Warning Alert
              </Button>
              {showWarning && (
                <div className="p-3 bg-gradient-to-r from-violet-50 via-blue-50 to-blue-100 border-2 border-violet-200 rounded-xl flex items-center gap-2 shadow-sm">
                  <WifiOff className="h-4 w-4 text-violet-600" />
                  <span className="text-sm text-violet-700 font-medium">
                    This is a warning message with blue gradient theme.
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Icons */}
        <Card>
          <CardHeader>
            <CardTitle>Status Icons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-blue-600 font-medium">Success</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <AlertCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-blue-500 font-medium">Error</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <AlertTriangle className="h-8 w-8 text-violet-600 mx-auto mb-2" />
                <p className="text-sm text-violet-600 font-medium">Warning</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <WifiOff className="h-8 w-8 text-violet-500 mx-auto mb-2" />
                <p className="text-sm text-violet-500 font-medium">Network</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Error Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Form Error States</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Login/Register Style Error */}
            <div className="p-4 text-sm text-red-700 bg-gradient-to-br from-red-50 via-red-100 to-pink-50 border border-red-200 rounded-xl shadow-lg">
              Invalid email or password. Please try again.
            </div>

            {/* Contact Form Style Success */}
            <div className="p-4 bg-gradient-to-br from-blue-50 via-blue-100 to-violet-50 border border-blue-200 rounded-lg flex items-center gap-3 shadow-lg">
              <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <h5 className="font-semibold text-blue-800">Message Sent Successfully</h5>
                <p className="text-sm text-blue-700">Thank you for contacting us. We'll get back to you soon.</p>
              </div>
            </div>

            {/* Verification Email Style */}
            <div className="text-sm text-blue-600 bg-gradient-to-br from-blue-50 via-blue-100 to-violet-50 border border-blue-200 rounded-md p-3 shadow-lg">
              Verification email has been resent successfully.
            </div>
          </CardContent>
        </Card>

        {/* Loading States */}
        <Card>
          <CardHeader>
            <CardTitle>Loading & Progress States</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-violet-50 rounded-lg">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-blue-700">Processing your request...</span>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-violet-50 to-blue-50 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-violet-700">Uploading file...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 