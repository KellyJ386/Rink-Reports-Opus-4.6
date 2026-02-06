import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { NotificationList } from "./components/NotificationList";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    is_read: boolean;
    created_at: string;
  }> = [];
  let unreadCount = 0;

  if (user) {
    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, message, link, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    notifications = data || [];
    unreadCount = notifications.filter((n) => !n.is_read).length;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="mt-1 text-muted-foreground">
            Stay updated on alerts and activity
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-action-green text-white">
            {unreadCount} unread
          </Badge>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <NotificationList initialNotifications={notifications} />
      )}
    </div>
  );
}
