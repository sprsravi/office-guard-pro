import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Filter, Download, Eye, Calendar as CalendarIcon, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { visitorsApi, type Visitor } from "@/lib/api";
import { cn } from "@/lib/utils";

const VisitorHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();

  // Fetch visitors from MySQL API
  const { data: visitors = [], isLoading, error, refetch } = useQuery<Visitor[]>({
    queryKey: ['visitors', fromDate, toDate, statusFilter],
    queryFn: () => visitorsApi.getAll({
      startDate: fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined,
      endDate: toDate ? format(toDate, 'yyyy-MM-dd') : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
  });

  // Client-side search filtering
  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = 
      visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (visitor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (visitor.company?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (visitor.phone?.includes(searchTerm) ?? false);
    
    return matchesSearch;
  });

  const handleExportCSV = async () => {
    try {
      await visitorsApi.exportCSV({
        startDate: fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined,
        endDate: toDate ? format(toDate, 'yyyy-MM-dd') : undefined,
      });
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const getStatusBadge = (status: Visitor['status']) => {
    switch (status) {
      case "checked_in":
        return <Badge className="bg-success text-success-foreground">Checked In</Badge>;
      case "checked_out":
        return <Badge variant="secondary">Checked Out</Badge>;
      case "pre_registered":
        return <Badge variant="outline">Pre-registered</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const mapStatusForFilter = (status: string): string => {
    if (status === 'checked-in') return 'checked_in';
    if (status === 'completed') return 'checked_out';
    return status;
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Visitor History</h2>
          <p className="text-muted-foreground">Track and manage all visitor records</p>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Failed to connect to backend</p>
                <p className="text-sm text-muted-foreground">
                  Make sure your MySQL backend is running at the configured API URL.
                </p>
              </div>
            </div>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <Select 
                value={statusFilter} 
                onValueChange={(value) => setStatusFilter(mapStatusForFilter(value))}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="checked_out">Checked Out</SelectItem>
                  <SelectItem value="pre_registered">Pre-registered</SelectItem>
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
                      className={cn("p-3 pointer-events-auto")}
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
                      className={cn("p-3 pointer-events-auto")}
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
                    setStatusFilter('all');
                    setSearchTerm('');
                  }}
                >
                  Clear Filters
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center space-x-2"
                  onClick={handleExportCSV}
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
          <CardTitle>
            Visitor Records {isLoading ? '' : `(${filteredVisitors.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredVisitors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No visitor records found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visitor</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Purpose</TableHead>
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
                          {visitor.id_proof_type && (
                            <div className="text-sm text-muted-foreground">
                              ID: {visitor.id_proof_type} - {visitor.id_proof_number}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{visitor.email ?? '-'}</div>
                          <div className="text-muted-foreground">{visitor.phone ?? '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>{visitor.company ?? '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{visitor.purpose}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{visitor.host_name}</div>
                          {visitor.host_department && (
                            <div className="text-sm text-muted-foreground">{visitor.host_department}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(visitor.check_in_time).toLocaleDateString()}
                          <div className="text-muted-foreground">
                            {new Date(visitor.check_in_time).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {visitor.check_out_time ? (
                          <div className="text-sm">
                            {new Date(visitor.check_out_time).toLocaleDateString()}
                            <div className="text-muted-foreground">
                              {new Date(visitor.check_out_time).toLocaleTimeString()}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VisitorHistory;
