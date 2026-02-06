'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { updateDataRetention } from './actions'
import { Database, Info, Loader2 } from 'lucide-react'

export default function DataRetentionPage() {
  const supabase = createClient()
  const { profile, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [standardRetention, setStandardRetention] = useState(3)
  const [incidentRetention, setIncidentRetention] = useState(7)
  const [archiveMode, setArchiveMode] = useState(false)

  useEffect(() => {
    if (authLoading || !profile?.facility_id) return

    async function loadData() {
      setLoading(true)
      try {
        const { data: facility, error } = await supabase
          .from('facilities')
          .select('data_retention_years, incident_retention_years, archive_mode')
          .eq('id', profile!.facility_id!)
          .single()

        if (error) throw error

        if (facility) {
          setStandardRetention(facility.data_retention_years ?? 3)
          setIncidentRetention(facility.incident_retention_years ?? 7)
          setArchiveMode(facility.archive_mode ?? false)
        }
      } catch (err) {
        console.error('Error loading data retention settings:', err)
        toast({
          title: 'Error',
          description: 'Failed to load data retention settings.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [authLoading, profile?.facility_id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (standardRetention < 1) {
      toast({
        title: 'Validation Error',
        description: 'Standard data retention must be at least 1 year.',
        variant: 'destructive',
      })
      return
    }

    if (incidentRetention < 1) {
      toast({
        title: 'Validation Error',
        description: 'Incident data retention must be at least 1 year.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const result = await updateDataRetention({
        data_retention_years: standardRetention,
        incident_retention_years: incidentRetention,
        archive_mode: archiveMode,
      })

      if (!result.success) {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save data retention settings.',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Data retention settings saved successfully.',
        variant: 'success',
      })
    } catch (err) {
      console.error('Error saving data retention settings:', err)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-wolf-grey" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Data Retention</h1>
        <p className="text-sm text-wolf-grey-dark dark:text-wolf-grey mt-1">
          Configure how long operational and incident data is retained.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-navy dark:text-action-green" />
            <CardTitle className="text-lg">Retention Periods</CardTitle>
          </div>
          <CardDescription>
            Set the number of years data is kept before automated cleanup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Standard Data Retention */}
          <div className="space-y-2">
            <Label htmlFor="standard-retention">Standard Data Retention (years)</Label>
            <p className="text-sm text-muted-foreground">
              Applies to daily reports, ice depth, operations, scheduling, and air quality data.
            </p>
            <Input
              id="standard-retention"
              type="number"
              min={1}
              value={standardRetention}
              onChange={(e) => setStandardRetention(Number(e.target.value))}
              className="max-w-[200px]"
            />
          </div>

          {/* Incident Data Retention */}
          <div className="space-y-2">
            <Label htmlFor="incident-retention">Incident Data Retention (years)</Label>
            <p className="text-sm text-muted-foreground">
              Incident records are typically kept longer for liability and compliance purposes.
            </p>
            <Input
              id="incident-retention"
              type="number"
              min={1}
              value={incidentRetention}
              onChange={(e) => setIncidentRetention(Number(e.target.value))}
              className="max-w-[200px]"
            />
          </div>

          {/* Archive Mode */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="archive-mode">Archive Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Preserve all data during facility closure periods.
                </p>
              </div>
              <Switch
                id="archive-mode"
                checked={archiveMode}
                onCheckedChange={setArchiveMode}
              />
            </div>

            {archiveMode && (
              <div className="flex gap-3 rounded-md border border-alert-yellow/50 bg-alert-yellow/10 p-4 dark:border-alert-yellow/30 dark:bg-alert-yellow/5">
                <Info className="h-5 w-5 shrink-0 text-alert-yellow mt-0.5" />
                <p className="text-sm text-foreground">
                  When Archive Mode is enabled, all data is preserved during facility closure
                  periods. No automated cleanup will occur.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pb-8">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-action-green hover:bg-action-green-hover text-white min-h-[48px] px-8"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
