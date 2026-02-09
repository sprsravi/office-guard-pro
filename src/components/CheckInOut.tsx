import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, UserX, Phone, Mail, Building2, IdCard, Loader2, Search, AlertCircle, Laptop } from "lucide-react";
import { visitorsApi, departmentsApi, hostsApi, purposesApi, Visitor } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CheckInOut = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("checkin");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    host_name: "",
    host_department: "",
    purpose: "",
    id_proof_type: "",
    id_proof_number: "",
    vehicle_number: "",
    notes: "",
    has_laptop: "no",
    laptop_make: "",
    laptop_model: "",
    laptop_serial: "",
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const { data: purposes = [] } = useQuery({
    queryKey: ['purposes'],
    queryFn: purposesApi.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const { data: hosts = [] } = useQuery({
    queryKey: ['hosts'],
    queryFn: hostsApi.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const { data: checkedInVisitors = [], isLoading: loadingVisitors, error: visitorsError } = useQuery({
    queryKey: ['visitors', 'checked_in'],
    queryFn: () => visitorsApi.getAll({ status: 'checked_in' }),
    staleTime: 30 * 1000,
  });

  const checkInMutation = useMutation({
    mutationFn: visitorsApi.checkIn,
    onSuccess: () => {
      toast({
        title: "Check-in Successful",
        description: "Visitor has been checked in successfully.",
      });
      setFormData({
        name: "", email: "", phone: "", company: "", host_name: "", host_department: "",
        purpose: "", id_proof_type: "", id_proof_number: "", vehicle_number: "", notes: "",
        has_laptop: "no", laptop_make: "", laptop_model: "", laptop_serial: "",
      });
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Check-in Failed",
        description: error.message || "Failed to check in visitor. Please try again.",
        variant: "destructive",
      });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: visitorsApi.checkOut,
    onSuccess: () => {
      toast({
        title: "Check-out Successful",
        description: "Visitor has been checked out successfully.",
      });
      setSelectedVisitor(null);
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Check-out Failed",
        description: error.message || "Failed to check out visitor. Please try again.",
        variant: "destructive",
      });
    },
  });

  const fallbackDepartments = [
    "Administration", "Customer Support", "Sales", "Finance", "GRC",
    "HR", "IT-Infrastructure", "Marketing", "Operation", "Technology"
  ];

  const idTypes = [
    "Aadhaar Card", "PAN Card", "Driving License", "Passport", "Voter ID", "Employee ID"
  ];

  const fallbackPurposes = [
    "Business Meeting", "Interview", "Delivery", "Maintenance", "Client Visit", "Training", "Other"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckIn = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || !formData.company || !formData.host_name) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.has_laptop === "yes" && (!formData.laptop_make || !formData.laptop_model || !formData.laptop_serial)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all laptop details (Make, Model, and Serial Number).",
        variant: "destructive",
      });
      return;
    }

    checkInMutation.mutate({
      ...formData,
      has_laptop: formData.has_laptop === "yes"
    });
  };

  const handleCheckOut = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedVisitor) {
      toast({
        title: "No Visitor Selected",
        description: "Please search and select a visitor to check out.",
        variant: "destructive",
      });
      return;
    }
    checkOutMutation.mutate(selectedVisitor.id);
  };

  const filteredVisitors = checkedInVisitors.filter(visitor =>
    visitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    visitor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    visitor.phone?.includes(searchQuery) ||
    visitor.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayDepartments = departments.length > 0 
    ? departments.map(d => d.name) 
    : fallbackDepartments;

  const displayPurposes = purposes.length > 0 
    ? purposes.map(p => p.name) 
    : fallbackPurposes;

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
                <UserCheck className="h-5 w-5 text-primary" />
                <span>Visitor Check In</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCheckIn} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" placeholder="Enter visitor's full name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email ID *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="visitor@company.com" className="pl-10" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} required />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="phone" placeholder="+91 9876543210" className="pl-10" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} required />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company">Company *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="company" placeholder="Company name" className="pl-10" value={formData.company} onChange={(e) => handleInputChange('company', e.target.value)} required />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="department">Department to Visit *</Label>
                    <Select value={formData.host_department} onValueChange={(value) => handleInputChange('host_department', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {displayDepartments.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="host">Host Person *</Label>
                    {hosts.length > 0 ? (
                      <Select value={formData.host_name} onValueChange={(value) => handleInputChange('host_name', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select host" />
                        </SelectTrigger>
                        <SelectContent>
                          {hosts.map((host) => (
                            <SelectItem key={host.id} value={host.name}>
                              {host.name} {host.department && `(${host.department})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input id="host" placeholder="Person to meet" value={formData.host_name} onChange={(e) => handleInputChange('host_name', e.target.value)} required />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="idType">ID Proof Type</Label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Select value={formData.id_proof_type} onValueChange={(value) => handleInputChange('id_proof_type', value)}>
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select ID type" />
                        </SelectTrigger>
                        <SelectContent>
                          {idTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="idNumber">ID Number</Label>
                    <Input id="idNumber" placeholder="ID proof number" value={formData.id_proof_number} onChange={(e) => handleInputChange('id_proof_number', e.target.value)} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vehicle">Vehicle Number</Label>
                    <Input id="vehicle" placeholder="Vehicle registration number" value={formData.vehicle_number} onChange={(e) => handleInputChange('vehicle_number', e.target.value)} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="hasLaptop">Carrying Laptop?</Label>
                    <div className="flex items-center space-x-2 h-10">
                      <Checkbox 
                        id="hasLaptop"
                        checked={formData.has_laptop === "yes"}
                        onCheckedChange={(checked) => handleInputChange('has_laptop', checked ? "yes" : "no")}
                      />
                      <label htmlFor="hasLaptop" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        Yes, I'm carrying a laptop
                      </label>
                    </div>
                  </div>
                </div>

                {formData.has_laptop === "yes" && (
                  <div className="p-4 bg-accent/30 rounded-lg border border-border space-y-4">
                    <div className="flex items-center space-x-2 text-primary">
                      <Laptop className="h-5 w-5" />
                      <span className="font-medium">Laptop Details</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="laptopMake">Laptop Make *</Label>
                        <Input id="laptopMake" placeholder="e.g., Dell, HP, Lenovo" value={formData.laptop_make} onChange={(e) => handleInputChange('laptop_make', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="laptopModel">Laptop Model *</Label>
                        <Input id="laptopModel" placeholder="e.g., Latitude 5520, ThinkPad X1" value={formData.laptop_model} onChange={(e) => handleInputChange('laptop_model', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="laptopSerial">Serial Number *</Label>
                        <Input id="laptopSerial" placeholder="Laptop serial number" value={formData.laptop_serial} onChange={(e) => handleInputChange('laptop_serial', e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose of Visit</Label>
                    <Select value={formData.purpose} onValueChange={(value) => handleInputChange('purpose', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        {displayPurposes.map((purpose) => (
                          <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea id="notes" placeholder="Any additional notes about the visit" className="min-h-[100px]" value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} />
                </div>
                
                <Button type="submit" className="w-full" size="lg" disabled={checkInMutation.isPending}>
                  {checkInMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                  ) : (
                    <><UserCheck className="h-4 w-4 mr-2" />Check In Visitor</>
                  )}
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
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="searchVisitor">Search Visitor</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="searchVisitor" placeholder="Search by name, mobile, email, or company" className="pl-10" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setSelectedVisitor(null); }} />
                    </div>
                  </div>

                  {visitorsError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>Unable to load visitors. Please try again later.</AlertDescription>
                    </Alert>
                  )}

                  {searchQuery && !selectedVisitor && (
                    <div className="border rounded-lg max-h-60 overflow-y-auto">
                      {loadingVisitors ? (
                        <div className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                      ) : filteredVisitors.length > 0 ? (
                        filteredVisitors.map((visitor) => (
                          <div key={visitor.id} className="p-3 border-b last:border-b-0 hover:bg-accent cursor-pointer transition-colors" onClick={() => setSelectedVisitor(visitor)}>
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{visitor.name}</p>
                                <p className="text-sm text-muted-foreground">{visitor.company}</p>
                              </div>
                              <Badge variant="secondary">{visitor.host_department || 'N/A'}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Checked in: {new Date(visitor.check_in_time).toLocaleString()}</p>
                          </div>
                        ))
                      ) : (
                        <p className="p-4 text-center text-muted-foreground">No checked-in visitors found matching your search.</p>
                      )}
                    </div>
                  )}
                </div>
                
                {selectedVisitor && (
                  <div className="p-4 bg-accent/50 rounded-lg border border-border">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium">Selected Visitor</h4>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedVisitor(null)}>Change</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Name:</span><span className="ml-2 font-medium">{selectedVisitor.name}</span></div>
                      <div><span className="text-muted-foreground">Company:</span><span className="ml-2 font-medium">{selectedVisitor.company || 'N/A'}</span></div>
                      <div><span className="text-muted-foreground">Check-in Time:</span><span className="ml-2 font-medium">{new Date(selectedVisitor.check_in_time).toLocaleString()}</span></div>
                      <div><span className="text-muted-foreground">Host:</span><span className="ml-2 font-medium">{selectedVisitor.host_name}</span></div>
                      <div><span className="text-muted-foreground">Department:</span><Badge variant="secondary" className="ml-2">{selectedVisitor.host_department || 'N/A'}</Badge></div>
                      <div><span className="text-muted-foreground">Purpose:</span><span className="ml-2 font-medium">{selectedVisitor.purpose || 'N/A'}</span></div>
                      {selectedVisitor.has_laptop && (
                        <>
                          <div><span className="text-muted-foreground">Laptop:</span><span className="ml-2 font-medium">{selectedVisitor.laptop_make} {selectedVisitor.laptop_model}</span></div>
                          <div><span className="text-muted-foreground">Serial No:</span><span className="ml-2 font-medium">{selectedVisitor.laptop_serial || 'N/A'}</span></div>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                <Button type="submit" variant="destructive" className="w-full" size="lg" disabled={!selectedVisitor || checkOutMutation.isPending}>
                  {checkOutMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                  ) : (
                    <><UserX className="h-4 w-4 mr-2" />Check Out Visitor</>
                  )}
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
