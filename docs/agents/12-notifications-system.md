# Agent 12: Notifications System

## Objective
Build the complete notification system: in-app notifications (bell icon + drawer), email notifications via Resend, SMS for critical alerts, and user-configurable notification preferences.

## Prerequisites
- Agents 00-11 completed (all modules generating notification triggers)

## Reference
- PRD Section 8 (Notifications System)

---

## Architecture

```
Trigger Event (e.g., out-of-range reading)
  → Server Action creates notification records
  → In-App: Insert into `notifications` table → Supabase Realtime pushes to client
  → Email: Call Resend API
  → SMS: Call SMS provider (Twilio or similar — stub for v1)
```

---

## Tasks

### 1. In-App Notification Bell
**File:** `src/components/layout/NotificationBell.tsx`

- Bell icon in header (already placed in Agent 04)
- Badge count: unread notifications from `notifications` table where `is_read = false`
- Click bell → opens Notification Drawer

### 2. Notification Drawer
**File:** `src/components/layout/NotificationDrawer.tsx`

- Slide-out panel from right (use Shadcn Sheet component)
- Header: "Notifications" with "Mark All Read" button
- List of notifications, newest first
- Each notification shows:
  - Title (bold)
  - Body text (1-2 lines)
  - Timestamp ("2 minutes ago", "Yesterday at 3:15 PM")
  - Unread indicator (blue dot on left)
  - Click → navigates to relevant page (using `link` field) and marks as read
- Empty state: "No notifications" with bell icon
- Infinite scroll or "Load More" for older notifications

### 3. Realtime Subscription
**File:** `src/lib/hooks/useNotifications.ts`

```typescript
// Subscribe to Supabase Realtime for new notifications
// Channel: notifications table, filter by recipient_id = auth.uid()
// On new notification:
//   - Increment badge count
//   - Show toast notification (brief popup)
//   - Play subtle sound (optional, user-configurable)
//   - Update notification list if drawer is open

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`,
      }, (payload) => {
        setUnreadCount(prev => prev + 1);
        setNotifications(prev => [payload.new, ...prev]);
        // Show toast
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return { unreadCount, notifications, markAsRead, markAllAsRead };
}
```

### 4. Notification Creation Service
**File:** `src/lib/services/notifications.ts`

Central service for creating notifications across all modules:

```typescript
interface NotificationPayload {
  facilityId: string;
  recipientIds: string[];       // who receives this
  title: string;
  body: string;
  link?: string;                // deep link in app
  triggerType: string;          // for preference matching
  channels?: NotificationChannel[]; // override default channels
}

export async function sendNotification(payload: NotificationPayload) {
  for (const recipientId of payload.recipientIds) {
    // 1. Check recipient's notification preferences
    const prefs = await getNotificationPreferences(recipientId, payload.triggerType);

    // 2. In-App (always, unless disabled)
    if (prefs.inApp) {
      await supabase.from('notifications').insert({
        facility_id: payload.facilityId,
        recipient_id: recipientId,
        title: payload.title,
        body: payload.body,
        link: payload.link,
      });
    }

    // 3. Email (if enabled)
    if (prefs.email) {
      await sendEmailNotification(recipientId, payload);
    }

    // 4. SMS (if enabled and critical)
    if (prefs.sms) {
      await sendSmsNotification(recipientId, payload);
    }
  }
}
```

### 5. Email Notifications via Resend
**File:** `src/lib/services/email.ts`

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailNotification(
  recipientId: string,
  payload: NotificationPayload
) {
  const profile = await getProfile(recipientId);

  await resend.emails.send({
    from: 'Max Facility <notifications@maxfacility.com>',
    to: profile.email,
    subject: payload.title,
    html: buildEmailTemplate(payload),
  });
}

function buildEmailTemplate(payload: NotificationPayload): string {
  // Clean, branded email template
  // Max Facility logo header
  // Title, body, action link button
  // Footer with unsubscribe/preferences link
}
```

### 6. SMS Notifications (Stub)
**File:** `src/lib/services/sms.ts`

```typescript
// v1: Stub implementation — log SMS intent
// v2: Integrate Twilio or similar
export async function sendSmsNotification(
  recipientId: string,
  payload: NotificationPayload
) {
  const profile = await getProfile(recipientId);
  if (!profile.phone) return;

  console.log(`[SMS STUB] To: ${profile.phone}, Message: ${payload.title}`);
  // TODO: Integrate Twilio
  // await twilioClient.messages.create({
  //   body: `${payload.title}: ${payload.body}`,
  //   to: profile.phone,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  // });
}
```

### 7. Notification Triggers — Integration Points

Update each module's server actions to call `sendNotification`:

| Trigger | Module | Recipients | Link |
|---|---|---|---|
| Out-of-range refrigeration reading | Refrigeration | Managers + Admins | `/refrigeration/[equipmentId]` |
| Out-of-range air quality reading | Air Quality | Managers + Admins | `/air-quality/history` |
| New incident/accident submitted | Incidents | Managers + Admins | `/incidents/[id]` |
| Shift reminder (upcoming shift) | Scheduling | Assigned employee | `/scheduling` |
| Shift swap request | Scheduling | Target employee + Managers | `/scheduling/swaps` |
| Swap approved/denied | Scheduling | Both employees | `/scheduling` |
| Open shift broadcast | Scheduling | All qualified employees | `/scheduling/open-shifts` |

### 8. Notification Preferences
**Route:** `/profile/notifications` or section in user profile

**UI:**
- Table/grid layout
- Rows: each trigger type (Out-of-Range Reading, New Incident, Shift Reminder, etc.)
- Columns: In-App, Email, SMS
- Checkboxes at intersections
- Save button

**Admin Override:**
- Certain notifications are mandatory (admin configures in Admin Control Center)
- Mandatory notifications show as checked and disabled (cannot be turned off)
- Example: critical safety alerts (out-of-range, incidents) cannot be disabled for managers

**Data Model:**
Uses `notification_preferences` table — one row per (profile_id, trigger_type, channel) combination.

### 9. Shift Reminders (Scheduled)
- Configurable timing: e.g., "Remind 1 hour before shift"
- Implementation options:
  - **Supabase Edge Function** with `pg_cron` to check upcoming shifts every 15 minutes
  - **Vercel Cron Job** hitting an API route
- Find shifts starting within reminder window, send notification if not already sent

```typescript
// Cron job: runs every 15 minutes
// SELECT shifts WHERE shift_date = today AND start_time between now() and now() + interval '1 hour'
// AND no reminder notification exists for this shift
// → Send shift reminder notification to assigned employee
```

### 10. Active Alerts Management
Update dashboard alert badges (from Agent 04) to use realtime:
- Subscribe to `active_alerts` table changes
- Update badge counts in real-time when alerts are created or acknowledged

## Completion Criteria
- [ ] Notification bell shows correct unread count
- [ ] Clicking bell opens notification drawer
- [ ] Notifications display with title, body, timestamp, read status
- [ ] Clicking notification navigates to relevant page and marks as read
- [ ] "Mark All Read" works
- [ ] Realtime: new notifications appear without page refresh
- [ ] Toast popup appears for new notifications
- [ ] Email notifications sent via Resend for enabled triggers
- [ ] Email template is branded and includes action link
- [ ] SMS stub logs messages (ready for Twilio integration)
- [ ] All module triggers create notifications correctly
- [ ] Notification preferences UI allows per-trigger, per-channel configuration
- [ ] Mandatory notifications cannot be disabled
- [ ] Shift reminders fire at configured time before shift
- [ ] Dashboard alert badges update in realtime
- [ ] Mobile responsive (drawer, preferences page)
- [ ] Dark mode supported
