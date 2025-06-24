
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Home, 
  Users, 
  Settings, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Star,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

const DesignSystem = () => {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('14:00');

  // Color palette data
  const primaryColors = [
    { name: 'primary-50', value: '#fff7ed', hex: '#fff7ed' },
    { name: 'primary-100', value: '#ffedd5', hex: '#ffedd5' },
    { name: 'primary-200', value: '#fed7aa', hex: '#fed7aa' },
    { name: 'primary-300', value: '#fdba74', hex: '#fdba74' },
    { name: 'primary-400', value: '#fb923c', hex: '#fb923c' },
    { name: 'primary-500', value: '#f97316', hex: '#f97316' },
    { name: 'primary-600', value: '#ea580c', hex: '#ea580c' },
    { name: 'primary-700', value: '#c2410c', hex: '#c2410c' },
    { name: 'primary-800', value: '#9a3412', hex: '#9a3412' },
    { name: 'primary-900', value: '#7c2d12', hex: '#7c2d12' },
  ];

  const neutralColors = [
    { name: 'neutral-0', value: '#ffffff', hex: '#ffffff' },
    { name: 'neutral-50', value: '#fafaf9', hex: '#fafaf9' },
    { name: 'neutral-100', value: '#f5f5f4', hex: '#f5f5f4' },
    { name: 'neutral-200', value: '#e7e5e4', hex: '#e7e5e4' },
    { name: 'neutral-300', value: '#d6d3d1', hex: '#d6d3d1' },
    { name: 'neutral-400', value: '#a8a29e', hex: '#a8a29e' },
    { name: 'neutral-500', value: '#78716c', hex: '#78716c' },
    { name: 'neutral-600', value: '#57534e', hex: '#57534e' },
    { name: 'neutral-700', value: '#44403c', hex: '#44403c' },
    { name: 'neutral-800', value: '#292524', hex: '#292524' },
    { name: 'neutral-900', value: '#1c1917', hex: '#1c1917' },
  ];

  const semanticColors = [
    { name: 'Success', light: '#f0fdf4', main: '#22c55e', dark: '#15803d' },
    { name: 'Warning', light: '#fffbeb', main: '#f59e0b', dark: '#b45309' },
    { name: 'Error', light: '#fef2f2', main: '#ef4444', dark: '#b91c1c' },
    { name: 'Info', light: '#eff6ff', main: '#3b82f6', dark: '#1d4ed8' },
  ];

  // Typography examples
  const typographyExamples = [
    { class: 'text-4xl font-extrabold', label: 'Heading 1', text: 'GM Platform Dashboard' },
    { class: 'text-3xl font-bold', label: 'Heading 2', text: 'Booking Management' },
    { class: 'text-2xl font-semibold', label: 'Heading 3', text: 'Customer Details' },
    { class: 'text-lg font-normal', label: 'Body Large', text: 'Welcome to the GM Platform, your comprehensive solution for venue management.' },
    { class: 'text-base font-normal', label: 'Body', text: 'Manage bookings, track revenue, and enhance customer experience.' },
    { class: 'text-sm font-normal', label: 'Body Small', text: 'Last updated: 2 minutes ago' },
    { class: 'text-xs font-medium uppercase tracking-wide', label: 'Caption', text: 'Status: Active' },
  ];

  // Time slots for component example
  const timeSlots = [
    { time: '10:00', price: 25, available: true },
    { time: '12:00', price: 30, available: true },
    { time: '14:00', price: 35, available: true },
    { time: '16:00', price: 30, available: false },
    { time: '18:00', price: 40, available: true },
    { time: '20:00', price: 45, available: true },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold text-neutral-900">GM Platform Design System</h1>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
            A comprehensive design system built for efficiency, clarity, and consistency across customer-facing and staff management interfaces.
          </p>
        </div>

        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="atoms">Atoms</TabsTrigger>
            <TabsTrigger value="molecules">Molecules</TabsTrigger>
            <TabsTrigger value="organisms">Organisms</TabsTrigger>
            <TabsTrigger value="spacing">Spacing</TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Primary Palette - Energy & Action</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-4">
                  {primaryColors.map((color) => (
                    <div key={color.name} className="text-center">
                      <div 
                        className="w-16 h-16 rounded-lg shadow-sm border mx-auto mb-2"
                        style={{ backgroundColor: color.hex }}
                      />
                      <p className="text-xs font-medium text-neutral-700">{color.name}</p>
                      <p className="text-xs text-neutral-500">{color.hex}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Neutral Palette - Foundation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 md:grid-cols-11 gap-4">
                  {neutralColors.map((color) => (
                    <div key={color.name} className="text-center">
                      <div 
                        className="w-16 h-16 rounded-lg shadow-sm border mx-auto mb-2"
                        style={{ backgroundColor: color.hex }}
                      />
                      <p className="text-xs font-medium text-neutral-700">{color.name}</p>
                      <p className="text-xs text-neutral-500">{color.hex}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Semantic Colors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {semanticColors.map((color) => (
                    <div key={color.name} className="space-y-3">
                      <h4 className="font-semibold text-neutral-800">{color.name}</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: color.light }}
                          />
                          <span className="text-sm">Light</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: color.main }}
                          />
                          <span className="text-sm">Main</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: color.dark }}
                          />
                          <span className="text-sm">Dark</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Typography Scale</CardTitle>
                <p className="text-neutral-600">Perfect Fourth (1.333) scale with Plus Jakarta Sans</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {typographyExamples.map((example, index) => (
                  <div key={index} className="border-b border-neutral-200 pb-4 last:border-0">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="md:w-32">
                        <span className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                          {example.label}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className={example.class} style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                          {example.text}
                        </p>
                      </div>
                      <div className="md:w-48">
                        <code className="text-xs bg-neutral-100 px-2 py-1 rounded">
                          {example.class}
                        </code>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Atoms Tab */}
          <TabsContent value="atoms" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Buttons</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-neutral-700">Variants</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button>Primary</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="destructive">Destructive</Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-neutral-700">Sizes</h4>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button size="sm">Small</Button>
                      <Button size="default">Default</Button>
                      <Button size="lg">Large</Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium text-neutral-700">With Icons</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button><Plus className="w-4 h-4 mr-2" />Add Booking</Button>
                      <Button variant="outline"><Edit className="w-4 h-4 mr-2" />Edit</Button>
                      <Button variant="destructive"><Trash2 className="w-4 h-4 mr-2" />Delete</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Form Elements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-neutral-700">
                      Customer Name *
                    </label>
                    <Input placeholder="Enter customer name" />
                    <p className="text-xs text-neutral-500">This field is required</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-neutral-700">
                      Email Address
                    </label>
                    <Input type="email" placeholder="customer@example.com" />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-neutral-700">
                      Phone Number
                    </label>
                    <Input type="tel" placeholder="+44 7700 900123" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status Badges</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Confirmed
                    </Badge>
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                      <XCircle className="w-3 h-3 mr-1" />
                      Cancelled
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                      <Star className="w-3 h-3 mr-1" />
                      VIP
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Icons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-6 gap-4">
                    {[Home, Calendar, Users, Settings, Clock, CheckCircle, AlertCircle, XCircle, Star, Plus, Edit, Trash2].map((Icon, index) => (
                      <div key={index} className="flex flex-col items-center p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors">
                        <Icon className="w-6 h-6 text-neutral-600 mb-2" />
                        <span className="text-xs text-neutral-500">{Icon.displayName || 'Icon'}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Molecules Tab */}
          <TabsContent value="molecules" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Time Slot Selector</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-800">Available Times</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.time}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedTimeSlot === slot.time
                              ? 'border-orange-500 bg-orange-50'
                              : slot.available
                              ? 'border-neutral-200 bg-white hover:border-orange-300 hover:bg-orange-25'
                              : 'border-neutral-200 bg-neutral-50 opacity-50 cursor-not-allowed'
                          }`}
                          onClick={() => slot.available && setSelectedTimeSlot(slot.time)}
                          disabled={!slot.available}
                        >
                          <div className="text-left">
                            <div className="font-medium text-neutral-800">{slot.time}</div>
                            <div className="text-sm text-neutral-600">£{slot.price}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Booking Detail Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-sm text-neutral-500">Date & Time</p>
                        <p className="font-medium text-neutral-800">Today at 2:00 PM</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-sm text-neutral-500">Duration</p>
                        <p className="font-medium text-neutral-800">2 hours</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-sm text-neutral-500">Guests</p>
                        <p className="font-medium text-neutral-800">4 people</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Base price (2h)</span>
                        <span className="text-neutral-800">£70.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Service fee</span>
                        <span className="text-neutral-800">£5.00</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>£75.00</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Organisms Tab */}
          <TabsContent value="organisms" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary Card</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white border border-neutral-200 rounded-lg p-6 max-w-md">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-neutral-800">Booking Summary</h3>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-sm text-neutral-500">Date & Time</p>
                        <p className="font-medium text-neutral-800">March 15, 2024 at 2:00 PM</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-sm text-neutral-500">Duration</p>
                        <p className="font-medium text-neutral-800">2 hours</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-sm text-neutral-500">Guests</p>
                        <p className="font-medium text-neutral-800">6 people</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Home className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-sm text-neutral-500">Venue</p>
                        <p className="font-medium text-neutral-800">Main Room</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-neutral-200">
                    <div className="flex justify-between text-neutral-600">
                      <span>Base price (2h)</span>
                      <span>£100.00</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>Equipment fee</span>
                      <span>£15.00</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>Service charge</span>
                      <span>£8.00</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Early bird discount</span>
                      <span>-£10.00</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xl font-semibold text-neutral-800">
                      <span>Total</span>
                      <span>£113.00</span>
                    </div>
                  </div>

                  <Button className="w-full mt-6 bg-orange-500 hover:bg-orange-600">
                    Confirm Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spacing Tab */}
          <TabsContent value="spacing" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Spacing System</CardTitle>
                <p className="text-neutral-600">Base 4px spatial scale for consistent spacing</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { name: 'space-1', size: '4px', rem: '0.25rem' },
                    { name: 'space-2', size: '8px', rem: '0.5rem' },
                    { name: 'space-3', size: '12px', rem: '0.75rem' },
                    { name: 'space-4', size: '16px', rem: '1rem' },
                    { name: 'space-5', size: '20px', rem: '1.25rem' },
                    { name: 'space-6', size: '24px', rem: '1.5rem' },
                    { name: 'space-8', size: '32px', rem: '2rem' },
                    { name: 'space-10', size: '40px', rem: '2.5rem' },
                    { name: 'space-12', size: '48px', rem: '3rem' },
                    { name: 'space-16', size: '64px', rem: '4rem' },
                    { name: 'space-20', size: '80px', rem: '5rem' },
                    { name: 'space-24', size: '96px', rem: '6rem' },
                  ].map((space) => (
                    <div key={space.name} className="flex items-center gap-6">
                      <div className="w-24 text-sm font-mono">{space.name}</div>
                      <div className="w-16 text-sm text-neutral-600">{space.size}</div>
                      <div className="w-20 text-sm text-neutral-600">{space.rem}</div>
                      <div 
                        className="bg-orange-200 border border-orange-300"
                        style={{ 
                          width: space.size,
                          height: '20px'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Border Radius</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: 'none', size: '0px', class: 'rounded-none' },
                    { name: 'sm', size: '4px', class: 'rounded-sm' },
                    { name: 'base', size: '8px', class: 'rounded' },
                    { name: 'md', size: '12px', class: 'rounded-md' },
                    { name: 'lg', size: '16px', class: 'rounded-lg' },
                    { name: 'xl', size: '24px', class: 'rounded-xl' },
                    { name: 'full', size: '9999px', class: 'rounded-full' },
                  ].map((radius) => (
                    <div key={radius.name} className="text-center">
                      <div 
                        className={`w-16 h-16 bg-orange-100 border border-orange-300 mx-auto mb-2 ${radius.class}`}
                      />
                      <p className="text-sm font-medium">{radius.name}</p>
                      <p className="text-xs text-neutral-500">{radius.size}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DesignSystem;
