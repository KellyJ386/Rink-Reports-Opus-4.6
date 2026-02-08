'use client';

import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ShiftBlock,
  type ShiftBlockData,
  type ShiftType,
} from '@/components/scheduling/ShiftBlock';

/* ------------------------------------------------------------------ */
/*  Types & Constants                                                  */
/* ------------------------------------------------------------------ */

type ViewMode = 'day' | 'week' | 'month';

const POSITION_LABELS: Record<ShiftType, string> = {
  zamboni: 'Zamboni Operator',
  front_desk: 'Front Desk',
  skate_rental: 'Skate Rental',
  maintenance: 'Maintenance',
};

const POSITION_COLORS: Record<ShiftType, string> = {
  zamboni: '#69BE28',
  front_desk: '#002244',
  skate_rental: '#A5ACAF',
  maintenance: '#FFB800',
};

const EMPLOYEES = [
  { id: 'emp-1', name: 'Sarah Johnson' },
  { id: 'emp-2', name: 'Mike Chen' },
  { id: 'emp-3', name: 'Alex Rivera' },
  { id: 'emp-4', name: 'Jordan Patel' },
  { id: 'emp-5', name: 'Taylor Brooks' },
];

/* ------------------------------------------------------------------ */
/*  Helper: date math                                                  */
/* ------------------------------------------------------------------ */

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMonthYear(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

function generateMockShifts(weekStart: Date): ShiftBlockData[] {
  const base = formatDate(weekStart);
  const mon = base;
  const tue = formatDate(addDays(weekStart, 1));
  const wed = formatDate(addDays(weekStart, 2));
  const thu = formatDate(addDays(weekStart, 3));
  const fri = formatDate(addDays(weekStart, 4));
  const sat = formatDate(addDays(weekStart, 5));

  return [
    {
      id: 's1',
      date: mon,
      startTime: '06:00',
      endTime: '14:00',
      position: 'zamboni',
      positionLabel: 'Zamboni Operator',
      employeeName: 'Sarah Johnson',
    },
    {
      id: 's2',
      date: mon,
      startTime: '08:00',
      endTime: '16:00',
      position: 'front_desk',
      positionLabel: 'Front Desk',
      employeeName: 'Mike Chen',
    },
    {
      id: 's3',
      date: tue,
      startTime: '10:00',
      endTime: '18:00',
      position: 'skate_rental',
      positionLabel: 'Skate Rental',
      employeeName: null,
    },
    {
      id: 's4',
      date: wed,
      startTime: '06:00',
      endTime: '14:00',
      position: 'zamboni',
      positionLabel: 'Zamboni Operator',
      employeeName: 'Alex Rivera',
    },
    {
      id: 's5',
      date: thu,
      startTime: '14:00',
      endTime: '22:00',
      position: 'maintenance',
      positionLabel: 'Maintenance',
      employeeName: 'Jordan Patel',
    },
    {
      id: 's6',
      date: fri,
      startTime: '08:00',
      endTime: '16:00',
      position: 'front_desk',
      positionLabel: 'Front Desk',
      employeeName: null,
    },
    {
      id: 's7',
      date: sat,
      startTime: '09:00',
      endTime: '17:00',
      position: 'skate_rental',
      positionLabel: 'Skate Rental',
      employeeName: 'Taylor Brooks',
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Add Shift Dialog                                                   */
/* ------------------------------------------------------------------ */

function AddShiftDialog({ onAdd }: { onAdd: (shift: ShiftBlockData) => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [position, setPosition] = useState<ShiftType | ''>('');
  const [assignedTo, setAssignedTo] = useState('');
  const [unassigned, setUnassigned] = useState(false);
  const [notes, setNotes] = useState('');

  function handleSubmit() {
    if (!date || !startTime || !endTime || !position) return;

    const employee =
      unassigned || !assignedTo
        ? null
        : EMPLOYEES.find((e) => e.id === assignedTo)?.name ?? null;

    onAdd({
      id: `s-${Date.now()}`,
      date,
      startTime,
      endTime,
      position: position as ShiftType,
      positionLabel: POSITION_LABELS[position as ShiftType],
      employeeName: employee,
      notes: notes || undefined,
    });

    toast({
      title: 'Success',
      description: `Shift created for ${POSITION_LABELS[position as ShiftType]} on ${date}.`,
    });

    // Reset & close
    setDate('');
    setStartTime('');
    setEndTime('');
    setPosition('');
    setAssignedTo('');
    setUnassigned(false);
    setNotes('');
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-[#69BE28] hover:bg-[#5AA822] text-white">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Shift
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Shift</DialogTitle>
          <DialogDescription>
            Create a new shift and optionally assign it to an employee.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Date */}
          <div className="grid gap-1.5">
            <Label htmlFor="shift-date">Date</Label>
            <Input
              id="shift-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Start / End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="shift-start">Start Time</Label>
              <Input
                id="shift-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="shift-end">End Time</Label>
              <Input
                id="shift-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Position / Type */}
          <div className="grid gap-1.5">
            <Label>Position / Type</Label>
            <Select
              value={position}
              onValueChange={(val) => setPosition(val as ShiftType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(POSITION_LABELS) as ShiftType[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: POSITION_COLORS[key] }}
                      />
                      {POSITION_LABELS[key]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assign To */}
          <div className="grid gap-1.5">
            <Label>Assign To</Label>
            <Select
              value={assignedTo}
              onValueChange={setAssignedTo}
              disabled={unassigned}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYEES.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Leave Unassigned */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="unassigned"
              checked={unassigned}
              onCheckedChange={(v) => {
                setUnassigned(v === true);
                if (v) setAssignedTo('');
              }}
            />
            <Label htmlFor="unassigned" className="font-normal cursor-pointer">
              Leave Unassigned (Open Shift)
            </Label>
          </div>

          {/* Notes */}
          <div className="grid gap-1.5">
            <Label htmlFor="shift-notes">Notes</Label>
            <Textarea
              id="shift-notes"
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!date || !startTime || !endTime || !position}
            className="bg-[#002244] hover:bg-[#003366]"
          >
            Create Shift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Week View                                                          */
/* ------------------------------------------------------------------ */

function WeekView({
  weekStart,
  shifts,
  onShiftClick,
}: {
  weekStart: Date;
  shifts: ShiftBlockData[];
  onShiftClick: (s: ShiftBlockData) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = formatDate(new Date());

  return (
    <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden border border-slate-200">
      {/* Column headers */}
      {days.map((day, i) => {
        const dateStr = formatDate(day);
        const isToday = dateStr === today;
        return (
          <div
            key={i}
            className={cn(
              'bg-white px-2 py-2.5 text-center border-b border-slate-200',
              isToday && 'bg-blue-50'
            )}
          >
            <div className="text-xs font-medium text-muted-foreground">
              {DAY_NAMES[i]}
            </div>
            <div
              className={cn(
                'text-sm font-semibold mt-0.5',
                isToday
                  ? 'bg-[#002244] text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto'
                  : 'text-foreground'
              )}
            >
              {day.getDate()}
            </div>
          </div>
        );
      })}

      {/* Shift cells */}
      {days.map((day, i) => {
        const dateStr = formatDate(day);
        const dayShifts = shifts.filter((s) => s.date === dateStr);
        const isToday = dateStr === today;
        return (
          <div
            key={`cell-${i}`}
            className={cn(
              'bg-white min-h-[140px] p-1.5 space-y-1.5',
              isToday && 'bg-blue-50/40'
            )}
          >
            {dayShifts.map((shift) => (
              <ShiftBlock
                key={shift.id}
                shift={shift}
                onClick={onShiftClick}
              />
            ))}
            {dayShifts.length === 0 && (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground italic">
                No shifts
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Day View                                                           */
/* ------------------------------------------------------------------ */

function DayView({
  date,
  shifts,
  onShiftClick,
}: {
  date: Date;
  shifts: ShiftBlockData[];
  onShiftClick: (s: ShiftBlockData) => void;
}) {
  const dateStr = formatDate(date);
  const dayShifts = shifts
    .filter((s) => s.date === dateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
        {date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </h3>

      {dayShifts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <CalendarIcon className="h-10 w-10 mb-2 opacity-30" />
          <p className="text-sm">No shifts scheduled for this day</p>
        </div>
      ) : (
        <div className="space-y-2 max-w-md">
          {dayShifts.map((shift) => (
            <div
              key={shift.id}
              className="flex items-start gap-3"
            >
              {/* Time column */}
              <div className="w-20 shrink-0 text-right text-xs text-muted-foreground pt-2 font-mono">
                {shift.startTime}
                <br />
                {shift.endTime}
              </div>
              {/* Shift block */}
              <div className="flex-1">
                <ShiftBlock shift={shift} onClick={onShiftClick} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Month View                                                         */
/* ------------------------------------------------------------------ */

function MonthView({
  currentDate,
  shifts,
  onDayClick,
}: {
  currentDate: Date;
  shifts: ShiftBlockData[];
  onDayClick: (date: Date) => void;
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = formatDate(new Date());

  // Pad to start on Monday
  let startPad = firstDay.getDay() - 1;
  if (startPad < 0) startPad = 6;

  const totalCells = startPad + lastDay.getDate();
  const rows = Math.ceil(totalCells / 7);

  const shiftsByDate = useMemo(() => {
    const map: Record<string, ShiftBlockData[]> = {};
    shifts.forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [shifts]);

  const cells: { date: Date | null; dateStr: string }[] = [];
  for (let i = 0; i < rows * 7; i++) {
    const dayNum = i - startPad + 1;
    if (dayNum < 1 || dayNum > lastDay.getDate()) {
      cells.push({ date: null, dateStr: '' });
    } else {
      const d = new Date(year, month, dayNum);
      cells.push({ date: d, dateStr: formatDate(d) });
    }
  }

  return (
    <div className="rounded-lg overflow-hidden border border-slate-200">
      {/* Header row */}
      <div className="grid grid-cols-7 bg-slate-100">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="text-center text-xs font-semibold text-muted-foreground py-2 border-b border-slate-200"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-slate-200">
        {cells.map((cell, i) => {
          if (!cell.date) {
            return <div key={i} className="bg-slate-50 min-h-[80px]" />;
          }

          const dayShifts = shiftsByDate[cell.dateStr] || [];
          const openCount = dayShifts.filter((s) => !s.employeeName).length;
          const isToday = cell.dateStr === today;

          return (
            <button
              key={i}
              type="button"
              onClick={() => cell.date && onDayClick(cell.date)}
              className={cn(
                'bg-white min-h-[80px] p-1.5 text-left hover:bg-slate-50 transition-colors',
                isToday && 'bg-blue-50/60'
              )}
            >
              <div
                className={cn(
                  'text-xs font-medium mb-1',
                  isToday
                    ? 'bg-[#002244] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]'
                    : 'text-foreground'
                )}
              >
                {cell.date.getDate()}
              </div>
              {dayShifts.length > 0 && (
                <div className="space-y-0.5">
                  <div className="text-[10px] font-semibold text-slate-600">
                    {dayShifts.length} shift{dayShifts.length !== 1 ? 's' : ''}
                  </div>
                  {openCount > 0 && (
                    <div className="text-[10px] font-medium text-amber-600">
                      {openCount} open
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function SchedulingPage() {
  const [view, setView] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const weekStart = getMonday(currentDate);
  const [shifts, setShifts] = useState<ShiftBlockData[]>(() =>
    generateMockShifts(getMonday(new Date()))
  );

  /* Navigation */
  function goToday() {
    setCurrentDate(new Date());
  }

  function goPrev() {
    if (view === 'day') setCurrentDate((d) => addDays(d, -1));
    else if (view === 'week') setCurrentDate((d) => addDays(d, -7));
    else {
      setCurrentDate((d) => {
        const nd = new Date(d);
        nd.setMonth(nd.getMonth() - 1);
        return nd;
      });
    }
  }

  function goNext() {
    if (view === 'day') setCurrentDate((d) => addDays(d, 1));
    else if (view === 'week') setCurrentDate((d) => addDays(d, 7));
    else {
      setCurrentDate((d) => {
        const nd = new Date(d);
        nd.setMonth(nd.getMonth() + 1);
        return nd;
      });
    }
  }

  /* Date range display */
  function dateRangeLabel(): string {
    if (view === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
    if (view === 'week') {
      const end = addDays(weekStart, 6);
      return `${formatShortDate(weekStart)} - ${formatShortDate(end)}, ${weekStart.getFullYear()}`;
    }
    return formatMonthYear(currentDate);
  }

  /* Add shift */
  function handleAddShift(shift: ShiftBlockData) {
    setShifts((prev) => [...prev, shift]);
  }

  /* Shift click handler */
  function handleShiftClick(shift: ShiftBlockData) {
    // For now, just a placeholder; a real app would open a detail/edit dialog
    console.log('Shift clicked:', shift);
  }

  /* Month view day click -> switch to day view */
  function handleMonthDayClick(date: Date) {
    setCurrentDate(date);
    setView('day');
  }

  /* Legend */
  const legendItems = (Object.keys(POSITION_LABELS) as ShiftType[]).map((key) => ({
    key,
    label: POSITION_LABELS[key],
    color: POSITION_COLORS[key],
  }));

  return (
    <div className="p-6 md:p-8 space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Employee Scheduling
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage shifts and employee assignments
          </p>
        </div>

        <AddShiftDialog onAdd={handleAddShift} />
      </div>

      {/* Navigation & View Toggle Bar */}
      <Card className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={goPrev} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={goNext} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-foreground ml-1">
            {dateRangeLabel()}
          </span>
        </div>

        {/* View toggle */}
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              className={cn(
                'px-4 py-1.5 text-xs font-semibold capitalize transition-colors',
                view === mode
                  ? 'bg-[#002244] text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4">
        {legendItems.map((item) => (
          <div key={item.key} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-muted-foreground font-medium">
              {item.label}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border-2 border-dashed border-slate-400" />
          <span className="text-xs text-muted-foreground font-medium">
            Open Shift
          </span>
        </div>
      </div>

      {/* Calendar Content */}
      {view === 'week' && (
        <WeekView
          weekStart={weekStart}
          shifts={shifts}
          onShiftClick={handleShiftClick}
        />
      )}

      {view === 'day' && (
        <DayView
          date={currentDate}
          shifts={shifts}
          onShiftClick={handleShiftClick}
        />
      )}

      {view === 'month' && (
        <MonthView
          currentDate={currentDate}
          shifts={shifts}
          onDayClick={handleMonthDayClick}
        />
      )}
    </div>
  );
}
