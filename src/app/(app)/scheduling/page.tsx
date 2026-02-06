import Link from "next/link";
import { getSchedules, getTimeOffRequests, getShiftSwapRequests } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduleActions } from "./ScheduleActions";

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "published":
      return "default";
    case "draft":
      return "secondary";
    case "cancelled":
      return "destructive";
    case "pending":
      return "outline";
    case "approved":
      return "default";
    case "denied":
      return "destructive";
    default:
      return "secondary";
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatWeekRange(weekStart: string) {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export default async function SchedulingPage() {
  const [schedulesResult, timeOffResult, swapsResult] = await Promise.all([
    getSchedules(),
    getTimeOffRequests(),
    getShiftSwapRequests(),
  ]);

  const schedules = schedulesResult.success ? schedulesResult.data : [];
  const timeOffRequests = timeOffResult.success ? timeOffResult.data : [];
  const swapRequests = swapsResult.success ? swapsResult.data : [];

  const pendingTimeOff = timeOffRequests.filter((r) => r.status === "pending");
  const pendingSwaps = swapRequests.filter((r) => r.status === "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Employee Scheduling
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage weekly schedules, time off, and shift swaps
          </p>
        </div>
        <ScheduleActions />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Schedules</CardDescription>
            <CardTitle className="text-2xl">{schedules.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {schedules.filter((s) => s.status === "published").length}{" "}
              published
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Draft Schedules</CardDescription>
            <CardTitle className="text-2xl">
              {schedules.filter((s) => s.status === "draft").length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Awaiting publish</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Time Off</CardDescription>
            <CardTitle className="text-2xl">{pendingTimeOff.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Requests awaiting review
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Swap Requests</CardDescription>
            <CardTitle className="text-2xl">{pendingSwaps.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Pending shift swaps
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="schedules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="time-off">
            Time Off
            {pendingTimeOff.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">
                {pendingTimeOff.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="swaps">
            Shift Swaps
            {pendingSwaps.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">
                {pendingSwaps.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedules</CardTitle>
              <CardDescription>
                View and manage employee schedules by week
              </CardDescription>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-lg font-medium text-muted-foreground">
                    No schedules yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create a new weekly schedule to get started
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Week</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Published
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Notes
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedules.map((schedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell className="font-medium">
                            {formatWeekRange(schedule.week_start)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusBadgeVariant(schedule.status)}
                            >
                              {schedule.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {schedule.published_at
                              ? formatDate(schedule.published_at)
                              : "--"}
                          </TableCell>
                          <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                            {schedule.notes || "--"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/scheduling/${schedule.id}`}>
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Off Tab */}
        <TabsContent value="time-off" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Time Off Requests</CardTitle>
              <CardDescription>
                Review and manage employee time off requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timeOffRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-lg font-medium text-muted-foreground">
                    No time off requests
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Time off requests from employees will appear here
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dates</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Reason
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Requested
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeOffRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {formatDate(request.start_date)} -{" "}
                            {formatDate(request.end_date)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusBadgeVariant(request.status)}
                            >
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden max-w-[200px] truncate sm:table-cell">
                            {request.reason || "--"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {formatDate(request.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shift Swaps Tab */}
        <TabsContent value="swaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shift Swap Requests</CardTitle>
              <CardDescription>
                Review and manage shift swap requests between employees
              </CardDescription>
            </CardHeader>
            <CardContent>
              {swapRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-lg font-medium text-muted-foreground">
                    No swap requests
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Shift swap requests from employees will appear here
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Reason
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Created
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {swapRequests.map((swap) => (
                        <TableRow key={swap.id}>
                          <TableCell className="font-medium font-mono text-xs">
                            {swap.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusBadgeVariant(swap.status)}
                            >
                              {swap.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden max-w-[200px] truncate sm:table-cell">
                            {swap.reason || "--"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {formatDate(swap.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
