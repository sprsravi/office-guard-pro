import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download, Eye } from "lucide-react";

const VisitorHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock data - in real app this would come from your MySQL database
  const visitors = [
    {
      id: 1,
      name: "John Smith",
      email: "john@techcorp.com",
      mobile: "+91 9876543210",
      company: "Tech Corp",
      department: "IT-Infrastructure",
      host: "Alice Johnson",
      checkIn: "2024-01-15 09:30:00",
      checkOut: "2024-01-15 17:45:00",
      status: "completed",
      idType: "Aadhaar Card",
      idNumber: "1234-5678-9012",
      purpose: "System maintenance discussion"
    },
    {
      id: 2,
      name: "Sarah Wilson",
      email: "sarah@marketing.com",
      mobile: "+91 9876543211",
      company: "Marketing Solutions",
      department: "Marketing",
      host: "Bob Smith",
      checkIn: "2024-01-15 11:00:00",
      checkOut: "2024-01-15 15:30:00",
      status: "completed",
      idType: "PAN Card",
      idNumber: "ABCDE1234F",
      purpose: "Campaign planning meeting"
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike@finance.com",
      mobile: "+91 9876543212",
      company: "Finance Plus",
      department: "Finance",
      host: "Carol Davis",
      checkIn: "2024-01-16 14:15:00",
      checkOut: null,
      status: "checked-in",
      idType: "Driving License",
      idNumber: "DL1234567890",
      purpose: "Budget review"
    }
  ];

  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = 
      visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.mobile.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || visitor.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "checked-in":
        return <Badge className="bg-success text-success-foreground">Checked In</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Visitor History</h2>
        <p className="text-muted-foreground">Track and manage all visitor records</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Search & Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, mobile, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="checked-in">Checked In</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Visitor Records ({filteredVisitors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitor</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisitors.map((visitor) => (
                  <TableRow key={visitor.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{visitor.name}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {visitor.idType} - {visitor.idNumber}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{visitor.email}</div>
                        <div className="text-muted-foreground">{visitor.mobile}</div>
                      </div>
                    </TableCell>
                    <TableCell>{visitor.company}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{visitor.department}</Badge>
                    </TableCell>
                    <TableCell>{visitor.host}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(visitor.checkIn).toLocaleDateString()}
                        <div className="text-muted-foreground">
                          {new Date(visitor.checkIn).toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {visitor.checkOut ? (
                        <div className="text-sm">
                          {new Date(visitor.checkOut).toLocaleDateString()}
                          <div className="text-muted-foreground">
                            {new Date(visitor.checkOut).toLocaleTimeString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(visitor.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisitorHistory;