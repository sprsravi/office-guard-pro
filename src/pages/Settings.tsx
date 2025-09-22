import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Users, Database, Bell, Shield } from "lucide-react";

const Settings = () => {
  const { toast } = useToast();

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

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground">Manage system configuration and preferences</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <SettingsIcon className="h-4 w-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Departments</span>
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Database</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" defaultValue="Your Company Name" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="ist">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ist">India Standard Time (IST)</SelectItem>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxVisitDuration">Max Visit Duration (hours)</Label>
                  <Input id="maxVisitDuration" type="number" defaultValue="8" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="autoCheckout">Auto Checkout After (hours)</Label>
                  <Input id="autoCheckout" type="number" defaultValue="12" />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireAppointment">Require Appointment</Label>
                    <p className="text-sm text-muted-foreground">Visitors must have appointments to check in</p>
                  </div>
                  <Switch id="requireAppointment" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableSMS">Enable SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send SMS alerts to hosts</p>
                  </div>
                  <Switch id="enableSMS" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableEmail">Enable Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send email alerts to hosts</p>
                  </div>
                  <Switch id="enableEmail" defaultChecked />
                </div>
              </div>
              
              <Button onClick={handleSaveSettings} className="w-full">
                Save General Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Active Departments</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {departments.map((dept) => (
                    <div key={dept} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <span className="text-sm font-medium">{dept}</span>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <Label>Add New Department</Label>
                <div className="flex space-x-2">
                  <Input placeholder="Department name" className="flex-1" />
                  <Button>Add</Button>
                </div>
              </div>
              
              <Button onClick={handleSaveSettings} className="w-full">
                Save Department Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Database Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-info" />
                  <span className="text-sm font-medium text-info">MySQL Database Setup</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Since you have your own MySQL server, here's the SQL schema for the visitor management system:
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Download Database Schema</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click the button below to download the complete SQL file for your MySQL server
                  </p>
                  <Button variant="outline" className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    Download visitor_management.sql
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Database Connection Status</Label>
                  <div className="flex items-center space-x-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm text-success">Connected to MySQL Server</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dbHost">Database Host</Label>
                    <Input id="dbHost" defaultValue="localhost" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dbPort">Port</Label>
                    <Input id="dbPort" defaultValue="3306" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dbName">Database Name</Label>
                    <Input id="dbName" defaultValue="visitor_management" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dbUser">Username</Label>
                    <Input id="dbUser" defaultValue="admin" />
                  </div>
                </div>
              </div>
              
              <Button onClick={handleSaveSettings} className="w-full">
                Test & Save Database Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifyCheckIn">Visitor Check-in Alerts</Label>
                    <p className="text-sm text-muted-foreground">Notify hosts when visitors check in</p>
                  </div>
                  <Switch id="notifyCheckIn" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifyCheckOut">Visitor Check-out Alerts</Label>
                    <p className="text-sm text-muted-foreground">Notify hosts when visitors check out</p>
                  </div>
                  <Switch id="notifyCheckOut" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifyOverstay">Overstay Alerts</Label>
                    <p className="text-sm text-muted-foreground">Alert when visitors exceed expected duration</p>
                  </div>
                  <Switch id="notifyOverstay" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dailyReport">Daily Reports</Label>
                    <p className="text-sm text-muted-foreground">Send daily visitor summary reports</p>
                  </div>
                  <Switch id="dailyReport" defaultChecked />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="alertEmail">Alert Email Recipients</Label>
                <Input id="alertEmail" placeholder="admin@company.com, security@company.com" />
              </div>
              
              <Button onClick={handleSaveSettings} className="w-full">
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;