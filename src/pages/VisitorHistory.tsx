import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Filter, Download, Eye, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

const VisitorHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();

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
    
    const checkInDate = new Date(visitor.checkIn);
    const matchesFromDate = !fromDate || checkInDate >= fromDate;
    const matchesToDate = !toDate || checkInDate <= toDate;
    
    return matchesSearch && matchesStatus && matchesFromDate && matchesToDate;
  });

  const exportToCSV = () => {
    const headers = [
      'Name', 'Email', 'Mobile', 'Company', 'Department', 'Host', 
      'Check In', 'Check Out', 'Status', 'ID Type', 'ID Number', 'Purpose'
    ];
    
    const csvData = filteredVisitors.map(visitor => [
      visitor.name,
      visitor.email,
      visitor.mobile,
      visitor.company,
      visitor.department,
      visitor.host,
      visitor.checkIn,
      visitor.checkOut || 'N/A',
      visitor.status,
      visitor.idType,
      visitor.idNumber,
      visitor.purpose
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const dateRange = fromDate && toDate 
      ? `_${format(fromDate, 'yyyy-MM-dd')}_to_${format(toDate, 'yyyy-MM-dd')}`
      : fromDate 
      ? `_from_${format(fromDate, 'yyyy-MM-dd')}`
      : toDate
      ? `_to_${format(toDate, 'yyyy-MM-dd')}`
      : '';
    
    link.setAttribute('download', `visitor_history${dateRange}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          <div className="flex flex-col gap-4">
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
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "PPP") : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={setFromDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">To Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={setToDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFromDate(undefined);
                    setToDate(undefined);
                  }}
                >
                  Clear Dates
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center space-x-2"
                  onClick={exportToCSV}
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </Button>
              </div>
            </div>
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