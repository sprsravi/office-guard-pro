import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download, Calendar, Users, TrendingUp, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { visitorsApi, type Visitor } from "@/lib/api";
import { useState, useMemo } from "react";
import { startOfWeek, startOfMonth, startOfQuarter, startOfYear, format, eachDayOfInterval, endOfWeek } from "date-fns";

const Reports = () => {
  const { toast } = useToast();
  const [period, setPeriod] = useState("week");

  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    switch (period) {
      case "month": start = startOfMonth(now); break;
      case "quarter": start = startOfQuarter(now); break;
      case "year": start = startOfYear(now); break;
      default: start = startOfWeek(now, { weekStartsOn: 1 }); break;
    }
    return { startDate: format(start, 'yyyy-MM-dd'), endDate: format(now, 'yyyy-MM-dd') };
  }, [period]);

  const { data: visitors = [], isLoading } = useQuery<Visitor[]>({
    queryKey: ['report-visitors', dateRange],
    queryFn: () => visitorsApi.getAll(dateRange),
  });

  const dailyVisitors = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const count = visitors.filter(v => v.check_in_time.startsWith(dayStr)).length;
      return { day: format(day, 'EEE'), visitors: count };
    });
  }, [visitors]);

  const departmentVisitors = useMemo(() => {
    const deptMap: Record<string, number> = {};
    visitors.forEach(v => {
      const dept = v.host_department || 'Other';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    const colors = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#6b7280"];
    return Object.entries(deptMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
  }, [visitors]);

  const topCompanies = useMemo(() => {
    const companyMap: Record<string, number> = {};
    visitors.forEach(v => {
      const company = v.company || 'Unknown';
      companyMap[company] = (companyMap[company] || 0) + 1;
    });
    return Object.entries(companyMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, visits]) => ({ name, visits }));
  }, [visitors]);

  const totalVisitors = visitors.length;
  const avgDaily = period === "week" ? (totalVisitors / 7).toFixed(1) : (totalVisitors / 30).toFixed(1);
  const peakDay = dailyVisitors.reduce((max, d) => d.visitors > max.visitors ? d : max, { day: '-', visitors: 0 });

  const avgDuration = useMemo(() => {
    const completed = visitors.filter(v => v.check_out_time);
    if (completed.length === 0) return '0h';
    const totalMin = completed.reduce((sum, v) => {
      const diff = new Date(v.check_out_time!).getTime() - new Date(v.check_in_time).getTime();
      return sum + diff / 60000;
    }, 0);
    return `${(totalMin / completed.length / 60).toFixed(1)}h`;
  }, [visitors]);

  const handleExportReport = async () => {
    try {
      await visitorsApi.exportCSV(dateRange);
      toast({ title: "Report Exported", description: "Visitor report has been downloaded successfully." });
    } catch {
      toast({ title: "Export Failed", description: "Could not export report.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Reports & Analytics</h2>
          <p className="text-muted-foreground">Comprehensive visitor analytics and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center space-x-2" onClick={handleExportReport}>
            <Download className="h-4 w-4" /><span>Export Report</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{totalVisitors}</div>}
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Daily Visits</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{avgDaily}</div>}
            <p className="text-xs text-muted-foreground">Average per day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Day</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
              <>
                <div className="text-2xl font-bold">{peakDay.day}</div>
                <div className="text-xs text-muted-foreground">{peakDay.visitors} visitors</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Visit Duration</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{avgDuration}</div>}
            <div className="text-xs text-muted-foreground">Average time spent</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Daily Visitor Trends</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyVisitors}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="visitors" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Visitors by Department</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : departmentVisitors.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={departmentVisitors} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }: any) => `${name} ${Math.round(percent * 100)}%`}>
                    {departmentVisitors.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Top Visiting Companies</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : topCompanies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No company data available yet</div>
          ) : (
            <div className="space-y-4">
              {topCompanies.map((company, index) => (
                <div key={company.name} className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-sm text-muted-foreground">{company.visits} visits</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
