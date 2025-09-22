import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, UserX, Phone, Mail, Building2, IdCard } from "lucide-react";

const CheckInOut = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("checkin");

  const departments = [
    "Administration",
    "Customer Support", 
    "Sales",
    "Finance",
    "GRC",
    "HR",
    "IT-Infrastructure",
    "Marketing",
    "Operation",
    "Technology"
  ];

  const idTypes = [
    "Aadhaar Card",
    "PAN Card",
    "Driving License",
    "Passport",
    "Voter ID",
    "Employee ID"
  ];

  const handleCheckIn = (event: React.FormEvent) => {
    event.preventDefault();
    toast({
      title: "Check-in Successful",
      description: "Visitor has been checked in successfully.",
    });
  };

  const handleCheckOut = (event: React.FormEvent) => {
    event.preventDefault();
    toast({
      title: "Check-out Successful", 
      description: "Visitor has been checked out successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Visitor Check In/Out</h2>
        <p className="text-muted-foreground">Manage visitor entry and exit</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="checkin" className="flex items-center space-x-2">
            <UserCheck className="h-4 w-4" />
            <span>Check In</span>
          </TabsTrigger>
          <TabsTrigger value="checkout" className="flex items-center space-x-2">
            <UserX className="h-4 w-4" />
            <span>Check Out</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkin">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-success" />
                <span>Visitor Check In</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCheckIn} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" placeholder="Enter visitor's full name" required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email ID *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="visitor@company.com" className="pl-10" required />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="mobile" placeholder="+91 9876543210" className="pl-10" required />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company">Company *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="company" placeholder="Company name" className="pl-10" required />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="department">Department to Visit *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept.toLowerCase()}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="host">Host Person *</Label>
                    <Input id="host" placeholder="Person to meet" required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="idType">ID Proof Type *</Label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Select>
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select ID type" />
                        </SelectTrigger>
                        <SelectContent>
                          {idTypes.map((type) => (
                            <SelectItem key={type} value={type.toLowerCase()}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="idNumber">ID Number *</Label>
                    <Input id="idNumber" placeholder="ID proof number" required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Office Location</Label>
                    <Input id="location" placeholder="Floor/Wing/Room" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="appointment">Appointment Time</Label>
                    <Input id="appointment" type="datetime-local" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="devices">Electronic Devices</Label>
                  <Textarea 
                    id="devices" 
                    placeholder="List any electronic devices (laptop, mobile, camera, etc.)"
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose of Visit</Label>
                  <Textarea 
                    id="purpose" 
                    placeholder="Brief description of visit purpose"
                    className="min-h-[100px]"
                  />
                </div>
                
                <Button type="submit" className="w-full" size="lg">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Check In Visitor
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checkout">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserX className="h-5 w-5 text-destructive" />
                <span>Visitor Check Out</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCheckOut} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="searchVisitor">Search Visitor</Label>
                    <Input 
                      id="searchVisitor" 
                      placeholder="Search by name, mobile, or email" 
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="exitTime">Exit Time</Label>
                    <Input id="exitTime" type="datetime-local" />
                  </div>
                </div>
                
                {/* Mock visitor details after search */}
                <div className="p-4 bg-accent/50 rounded-lg border border-border">
                  <h4 className="font-medium mb-3">Visitor Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <span className="ml-2 font-medium">John Smith</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Company:</span>
                      <span className="ml-2 font-medium">Tech Corp</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Check-in Time:</span>
                      <span className="ml-2 font-medium">09:30 AM</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Department:</span>
                      <Badge variant="secondary">IT-Infrastructure</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="feedback">Visit Feedback (Optional)</Label>
                  <Textarea 
                    id="feedback" 
                    placeholder="Any feedback about the visit"
                    className="min-h-[100px]"
                  />
                </div>
                
                <Button type="submit" variant="destructive" className="w-full" size="lg">
                  <UserX className="h-4 w-4 mr-2" />
                  Check Out Visitor
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CheckInOut;