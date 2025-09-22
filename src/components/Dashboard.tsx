import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Clock } from "lucide-react";

const Dashboard = () => {
  // Mock data - in real app this would come from your MySQL database
  const stats = {
    totalVisitors: 1247,
    checkedIn: 23,
    checkedOut: 1224,
    pending: 5,
  };

  const recentVisitors = [
    {
      id: 1,
      name: "John Smith",
      company: "Tech Corp",
      department: "IT-Infrastructure",
      status: "checked-in",
      time: "09:30 AM",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      company: "Marketing Solutions",
      department: "Marketing",
      status: "checked-out",
      time: "11:45 AM",
    },
    {
      id: 3,
      name: "Mike Wilson",
      company: "Finance Plus",
      department: "Finance",
      status: "checked-in",
      time: "02:15 PM",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Overview of visitor activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVisitors}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In</CardTitle>
            <UserCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.checkedIn}</div>
            <p className="text-xs text-muted-foreground">Currently in office</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked Out</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.checkedOut}</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Appointments</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Visitors */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Visitor Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentVisitors.map((visitor) => (
              <div
                key={visitor.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-accent/50"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {visitor.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{visitor.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {visitor.company} • {visitor.department}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      visitor.status === "checked-in"
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {visitor.status === "checked-in" ? "Checked In" : "Checked Out"}
                  </span>
                  <p className="text-sm text-muted-foreground mt-1">{visitor.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;