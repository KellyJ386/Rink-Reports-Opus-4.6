'use client';

import Link from 'next/link';
import { ArrowLeft, AlertTriangle, ShieldAlert, Clock, MapPin, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BodyDiagram } from '@/components/diagrams/BodyDiagram';
import { BODY_REGION_MAP } from '@/lib/constants/bodyRegions';

/* ------------------------------------------------------------------ */
/*  Mock Data for detail view                                          */
/* ------------------------------------------------------------------ */

interface IncidentDetail {
  id: string;
  type: 'incident' | 'accident';
  dateTime: string;
  location: string;
  description: string;
  witnesses: string;
  submittedBy: string;
  submittedAt: string;
  // Accident fields
  injuredPartyName?: string;
  injuredPartyType?: 'patron' | 'staff';
  bodyRegions?: string[];
}

const MOCK_DETAIL: Record<string, IncidentDetail> = {
  'inc-001': {
    id: 'inc-001',
    type: 'accident',
    dateTime: '2026-02-06T14:30:00',
    location: 'Main Rink',
    description:
      'Patron fell on the ice surface near the east goal and reported pain in their left wrist. First aid administered on site. Patron was provided with an ice pack and advised to visit urgent care for X-ray. The incident occurred during open skate session at approximately 2:30 PM. The ice surface was recently resurfaced and was in standard condition. No equipment malfunction was observed.',
    witnesses: 'Jane Doe, Bob Smith',
    submittedBy: 'Sarah Johnson',
    submittedAt: '2026-02-06T15:10:00',
    injuredPartyName: 'Michael Thompson',
    injuredPartyType: 'patron',
    bodyRegions: ['left_hand', 'left_forearm', 'left_knee'],
  },
  'inc-002': {
    id: 'inc-002',
    type: 'incident',
    dateTime: '2026-02-05T09:15:00',
    location: 'Lobby',
    description:
      'Water leak from the ceiling near the main entrance caused a small puddle on the floor. Area was immediately cordoned off with wet floor signs and caution tape. Maintenance was notified and responded within 10 minutes. The leak was traced to a pipe fitting above the dropped ceiling. Cleaned and dried within 30 minutes. No injuries reported.',
    witnesses: 'Front desk staff on duty',
    submittedBy: 'Mike Chen',
    submittedAt: '2026-02-05T09:45:00',
  },
  'inc-003': {
    id: 'inc-003',
    type: 'accident',
    dateTime: '2026-02-03T18:45:00',
    location: 'Rink B',
    description:
      'Collision between two skaters during open session. Skater A was traveling at moderate speed and did not see Skater B who had stopped near center ice. Both parties reported minor bruising. Ice marshal documented the incident and both signed waivers. Neither party required medical transport.',
    witnesses: 'Ice Marshal Rodriguez, Multiple patrons',
    submittedBy: 'Alex Rivera',
    submittedAt: '2026-02-03T19:20:00',
    injuredPartyName: 'Lisa Park',
    injuredPartyType: 'patron',
    bodyRegions: ['right_shoulder', 'right_elbow', 'hip'],
  },
  'inc-004': {
    id: 'inc-004',
    type: 'incident',
    dateTime: '2026-02-01T11:00:00',
    location: 'Locker Room A',
    description:
      'Locker #42 lock was found broken during routine morning inspection. Contents appeared undisturbed — patron confirmed all belongings accounted for. Lock was replaced with a new one and the patron was notified via phone. Surveillance footage from the hallway camera is being reviewed by management. No signs of forced entry on adjacent lockers.',
    witnesses: 'Maintenance staff',
    submittedBy: 'Jordan Patel',
    submittedAt: '2026-02-01T11:30:00',
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/* ------------------------------------------------------------------ */
/*  Field display helper                                               */
/* ------------------------------------------------------------------ */

function DetailField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function IncidentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const incident = MOCK_DETAIL[params.id];

  if (!incident) {
    return (
      <div className="p-6 md:p-8">
        <Link href="/incidents">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Incidents
          </Button>
        </Link>
        <Card className="mt-4 flex flex-col items-center justify-center py-16 text-muted-foreground">
          <AlertTriangle className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">Incident report not found</p>
        </Card>
      </div>
    );
  }

  const isAccident = incident.type === 'accident';

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/incidents">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              Incident Report
            </h1>
            <Badge
              className={cn(
                'text-[11px] font-semibold',
                isAccident
                  ? 'bg-red-100 text-red-800 border-red-200'
                  : 'bg-amber-100 text-amber-800 border-amber-200'
              )}
            >
              {isAccident && <AlertTriangle className="mr-1 h-3 w-3" />}
              {incident.type.charAt(0).toUpperCase() + incident.type.slice(1)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            ID: {incident.id}
          </p>
        </div>
      </div>

      {/* Main detail card */}
      <Card className="p-6">
        <dl className="space-y-5">
          {/* Date / Time */}
          <DetailField label="Date & Time" icon={Clock}>
            {formatDateTime(incident.dateTime)}
          </DetailField>

          {/* Location */}
          <DetailField label="Location" icon={MapPin}>
            {incident.location}
          </DetailField>

          <Separator />

          {/* Description */}
          <DetailField label="Description">
            <p className="whitespace-pre-wrap leading-relaxed">
              {incident.description}
            </p>
          </DetailField>

          <Separator />

          {/* Witnesses */}
          <DetailField label="Witnesses" icon={Users}>
            {incident.witnesses || (
              <span className="text-muted-foreground italic">None recorded</span>
            )}
          </DetailField>

          {/* Submitted By */}
          <DetailField label="Submitted By" icon={User}>
            <span>{incident.submittedBy}</span>
            <span className="text-muted-foreground ml-2 text-xs">
              on {formatDateTime(incident.submittedAt)}
            </span>
          </DetailField>
        </dl>
      </Card>

      {/* Accident details card */}
      {isAccident && (
        <Card className="border-red-200 bg-red-50/30 p-6 space-y-5">
          <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Accident Details
          </h3>

          <dl className="space-y-5">
            {/* Injured Party */}
            <DetailField label="Injured Party Name">
              {incident.injuredPartyName || (
                <span className="text-muted-foreground italic">Not recorded</span>
              )}
            </DetailField>

            <DetailField label="Injured Party Type">
              {incident.injuredPartyType ? (
                <Badge variant="outline" className="capitalize text-xs">
                  {incident.injuredPartyType}
                </Badge>
              ) : (
                <span className="text-muted-foreground italic">Not recorded</span>
              )}
            </DetailField>

            {/* Body Diagram */}
            {incident.bodyRegions && incident.bodyRegions.length > 0 && (
              <div className="space-y-2">
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Injury Locations
                </dt>
                <dd>
                  <div className="bg-white rounded-lg border border-red-100 p-4">
                    <BodyDiagram
                      selectedRegions={incident.bodyRegions}
                      onRegionToggle={() => {}}
                      readOnly
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {incident.bodyRegions.map((regionId) => {
                      const region = BODY_REGION_MAP[regionId];
                      return (
                        <span
                          key={regionId}
                          className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 border border-red-200"
                        >
                          {region?.label ?? regionId}
                        </span>
                      );
                    })}
                  </div>
                </dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      {/* Back button */}
      <div>
        <Link href="/incidents">
          <Button variant="outline">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to All Reports
          </Button>
        </Link>
      </div>
    </div>
  );
}
