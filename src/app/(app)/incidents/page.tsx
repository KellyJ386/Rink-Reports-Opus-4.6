'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  AlertTriangle,
  ChevronRight,
  FileWarning,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface IncidentRecord {
  id: string;
  type: 'incident' | 'accident';
  dateTime: string;
  location: string;
  description: string;
  submittedBy: string;
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_INCIDENTS: IncidentRecord[] = [
  {
    id: 'inc-001',
    type: 'accident',
    dateTime: '2026-02-06T14:30:00',
    location: 'Main Rink',
    description:
      'Patron fell on the ice surface near the east goal and reported pain in their left wrist. First aid administered on site. Patron advised to visit urgent care.',
    submittedBy: 'Sarah Johnson',
  },
  {
    id: 'inc-002',
    type: 'incident',
    dateTime: '2026-02-05T09:15:00',
    location: 'Lobby',
    description:
      'Water leak from the ceiling near the main entrance caused a small puddle. Area was cordoned off and maintenance notified. Cleaned within 30 minutes.',
    submittedBy: 'Mike Chen',
  },
  {
    id: 'inc-003',
    type: 'accident',
    dateTime: '2026-02-03T18:45:00',
    location: 'Rink B',
    description:
      'Collision between two skaters during open session. Both parties reported minor bruising. Ice marshal documented the incident and both signed waivers.',
    submittedBy: 'Alex Rivera',
  },
  {
    id: 'inc-004',
    type: 'incident',
    dateTime: '2026-02-01T11:00:00',
    location: 'Locker Room A',
    description:
      'Locker #42 lock was found broken. Contents appeared undisturbed. Lock replaced and patron notified. Surveillance footage being reviewed.',
    submittedBy: 'Jordan Patel',
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '...';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function IncidentsPage() {
  const [typeFilter, setTypeFilter] = useState<'all' | 'incident' | 'accident'>('all');
  const [searchText, setSearchText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  /* Filtering */
  const filtered = MOCK_INCIDENTS.filter((inc) => {
    if (typeFilter !== 'all' && inc.type !== typeFilter) return false;
    if (searchText) {
      const lc = searchText.toLowerCase();
      if (
        !inc.description.toLowerCase().includes(lc) &&
        !inc.location.toLowerCase().includes(lc) &&
        !inc.submittedBy.toLowerCase().includes(lc)
      ) {
        return false;
      }
    }
    if (startDate && inc.dateTime < startDate) return false;
    if (endDate && inc.dateTime > endDate + 'T23:59:59') return false;
    return true;
  });

  return (
    <div className="p-6 md:p-8 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Incident Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View and manage incident and accident reports
          </p>
        </div>
        <Link href="/incidents/new">
          <Button size="sm" className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white">
            <Plus className="mr-1.5 h-4 w-4" />
            New Report
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Type filter */}
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as 'all' | 'incident' | 'accident')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="incident">Incident</SelectItem>
                <SelectItem value="accident">Accident</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileWarning className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">No incident reports found</p>
          <p className="text-xs mt-1">Adjust your filters or create a new report</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[160px]">Date / Time</TableHead>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead className="w-[120px]">Location</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[130px]">Submitted By</TableHead>
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inc) => (
                <TableRow key={inc.id} className="group">
                  <TableCell className="text-sm font-medium whitespace-nowrap">
                    {formatDateTime(inc.dateTime)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        'text-[11px] font-semibold',
                        inc.type === 'accident'
                          ? 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100'
                          : 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100'
                      )}
                    >
                      {inc.type === 'accident' ? (
                        <AlertTriangle className="mr-1 h-3 w-3" />
                      ) : null}
                      {inc.type.charAt(0).toUpperCase() + inc.type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{inc.location}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[300px]">
                    {truncate(inc.description, 90)}
                  </TableCell>
                  <TableCell className="text-sm">{inc.submittedBy}</TableCell>
                  <TableCell>
                    <Link href={`/incidents/${inc.id}`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
