'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, ShieldAlert, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BodyDiagram } from '@/components/diagrams/BodyDiagram';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const LOCATIONS = [
  { value: 'main_rink', label: 'Main Rink' },
  { value: 'rink_b', label: 'Rink B' },
  { value: 'lobby', label: 'Lobby' },
  { value: 'locker_room_a', label: 'Locker Room A' },
  { value: 'locker_room_b', label: 'Locker Room B' },
  { value: 'other', label: 'Other' },
];

type IncidentType = 'incident' | 'accident';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NewIncidentPage() {
  const router = useRouter();
  const { toast } = useToast();

  /* Form state */
  const [incidentType, setIncidentType] = useState<IncidentType>('incident');
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [locationOther, setLocationOther] = useState('');
  const [description, setDescription] = useState('');
  const [witnesses, setWitnesses] = useState('');

  /* Accident-specific fields */
  const [injuredPartyName, setInjuredPartyName] = useState('');
  const [injuredPartyType, setInjuredPartyType] = useState<'patron' | 'staff' | ''>('');
  const [selectedBodyRegions, setSelectedBodyRegions] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);

  const isAccident = incidentType === 'accident';

  function handleBodyRegionToggle(regionId: string) {
    setSelectedBodyRegions((prev) =>
      prev.includes(regionId)
        ? prev.filter((id) => id !== regionId)
        : [...prev, regionId]
    );
  }

  function canSubmit(): boolean {
    if (!dateTime || !location || !description.trim()) return false;
    if (location === 'other' && !locationOther.trim()) return false;
    return true;
  }

  async function handleSubmit() {
    if (!canSubmit()) return;
    setSubmitting(true);

    // In a real app, this would call createIncidentReport server action.
    // For now, simulate a brief delay and redirect.
    await new Promise((resolve) => setTimeout(resolve, 600));

    router.push('/incidents');
  }

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/incidents">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Incident Report</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Document an incident or accident that occurred at the facility
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6 space-y-6">
        {/* Incident Type Toggle */}
        <div className="grid gap-2">
          <Label className="text-sm font-semibold">Report Type</Label>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden w-fit">
            <button
              type="button"
              onClick={() => setIncidentType('incident')}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-colors',
                incidentType === 'incident'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              <ShieldAlert className="h-4 w-4" />
              Incident
            </button>
            <button
              type="button"
              onClick={() => setIncidentType('accident')}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-colors',
                incidentType === 'accident'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              <AlertTriangle className="h-4 w-4" />
              Accident
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {isAccident
              ? 'An accident involves injury to a person. Additional details are required.'
              : 'An incident is a notable event that did not result in personal injury.'}
          </p>
        </div>

        {/* Date / Time */}
        <div className="grid gap-1.5 max-w-xs">
          <Label htmlFor="datetime" className="text-sm font-semibold">
            Date and Time
          </Label>
          <Input
            id="datetime"
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
          />
        </div>

        {/* Location */}
        <div className="grid gap-1.5">
          <Label className="text-sm font-semibold">Location</Label>
          <div className="max-w-xs">
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((loc) => (
                  <SelectItem key={loc.value} value={loc.value}>
                    {loc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {location === 'other' && (
            <Input
              placeholder="Describe the location..."
              value={locationOther}
              onChange={(e) => setLocationOther(e.target.value)}
              className="mt-2 max-w-xs"
            />
          )}
        </div>

        {/* Description */}
        <div className="grid gap-1.5">
          <Label htmlFor="description" className="text-sm font-semibold">
            Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Provide a detailed description of what occurred..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </div>

        {/* ---- Accident-specific fields ---- */}
        {isAccident && (
          <div className="space-y-5 rounded-lg border border-red-200 bg-red-50/40 p-5">
            <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Accident Details
            </h3>

            {/* Injured Party Name */}
            <div className="grid gap-1.5 max-w-sm">
              <Label htmlFor="injured-name" className="text-sm font-semibold">
                Injured Party Name
              </Label>
              <Input
                id="injured-name"
                placeholder="Full name of injured person"
                value={injuredPartyName}
                onChange={(e) => setInjuredPartyName(e.target.value)}
              />
            </div>

            {/* Injured Party Type */}
            <div className="grid gap-1.5 max-w-xs">
              <Label className="text-sm font-semibold">Injured Party Type</Label>
              <Select
                value={injuredPartyType}
                onValueChange={(v) => setInjuredPartyType(v as 'patron' | 'staff')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patron">Patron</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Body Diagram */}
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">
                Injury Location (tap affected areas)
              </Label>
              <div className="bg-white rounded-lg border border-red-100 p-4">
                <BodyDiagram
                  selectedRegions={selectedBodyRegions}
                  onRegionToggle={handleBodyRegionToggle}
                />
              </div>
            </div>
          </div>
        )}

        {/* Witnesses */}
        <div className="grid gap-1.5">
          <Label htmlFor="witnesses" className="text-sm font-semibold">
            Witnesses
          </Label>
          <Input
            id="witnesses"
            placeholder="Names of any witnesses (comma separated)"
            value={witnesses}
            onChange={(e) => setWitnesses(e.target.value)}
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit() || submitting}
            className={cn(
              'text-white',
              isAccident
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#002244] hover:bg-[#003366]'
            )}
          >
            {submitting ? (
              <>Submitting...</>
            ) : (
              <>
                <Send className="mr-1.5 h-4 w-4" />
                Submit Report
              </>
            )}
          </Button>
          <Link href="/incidents">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
