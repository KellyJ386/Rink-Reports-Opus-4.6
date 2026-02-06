"use client";

import { useState, useCallback } from "react";
import { saveChecklistResponse } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type {
  TabConfiguration,
  ChecklistItem,
  ChecklistResponse,
} from "@/lib/types/database";

interface ChecklistSectionProps {
  tab: TabConfiguration & { checklist_items: ChecklistItem[] };
  responses: ChecklistResponse[];
  reportId: string;
  isEditable: boolean;
}

export function ChecklistSection({
  tab,
  responses,
  reportId,
  isEditable,
}: ChecklistSectionProps) {
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set());
  const [localResponses, setLocalResponses] = useState<Record<string, {
    value: string | null;
    numeric_value: number | null;
    is_flagged: boolean;
    notes: string | null;
  }>>(() => {
    const map: Record<string, {
      value: string | null;
      numeric_value: number | null;
      is_flagged: boolean;
      notes: string | null;
    }> = {};
    for (const resp of responses) {
      map[resp.checklist_item_id] = {
        value: resp.value,
        numeric_value: resp.numeric_value,
        is_flagged: resp.is_flagged,
        notes: resp.notes,
      };
    }
    return map;
  });

  const saveResponse = useCallback(
    async (
      checklistItemId: string,
      value: string | null,
      numericValue: number | null,
      isFlagged: boolean,
      notes: string | null
    ) => {
      setSavingItems((prev) => new Set(prev).add(checklistItemId));

      const formData = new FormData();
      formData.set("daily_report_id", reportId);
      formData.set("checklist_item_id", checklistItemId);
      formData.set("tab_id", tab.id);
      if (value !== null) formData.set("value", value);
      if (numericValue !== null) formData.set("numeric_value", String(numericValue));
      formData.set("is_flagged", String(isFlagged));
      if (notes) formData.set("notes", notes);

      await saveChecklistResponse(formData);

      setSavingItems((prev) => {
        const next = new Set(prev);
        next.delete(checklistItemId);
        return next;
      });
    },
    [reportId, tab.id]
  );

  function getResponseForItem(itemId: string) {
    return localResponses[itemId] ?? {
      value: null,
      numeric_value: null,
      is_flagged: false,
      notes: null,
    };
  }

  function handleValueChange(
    item: ChecklistItem,
    newValue: string | null,
    newNumericValue: number | null
  ) {
    const current = getResponseForItem(item.id);
    const updated = {
      ...current,
      value: newValue,
      numeric_value: newNumericValue,
    };

    // Auto-flag if value is outside thresholds
    let flagged = current.is_flagged;
    if (newNumericValue !== null) {
      if (
        (item.min_value !== null && newNumericValue < item.min_value) ||
        (item.max_value !== null && newNumericValue > item.max_value)
      ) {
        flagged = true;
      }
    }
    updated.is_flagged = flagged;

    setLocalResponses((prev) => ({ ...prev, [item.id]: updated }));
    saveResponse(item.id, newValue, newNumericValue, flagged, current.notes);
  }

  function handleNotesChange(itemId: string, notes: string) {
    const current = getResponseForItem(itemId);
    const updated = { ...current, notes: notes || null };
    setLocalResponses((prev) => ({ ...prev, [itemId]: updated }));
    // Debounce notes saving is left to the user finishing typing (onBlur)
  }

  function handleNotesBlur(itemId: string) {
    const current = getResponseForItem(itemId);
    saveResponse(itemId, current.value, current.numeric_value, current.is_flagged, current.notes);
  }

  if (tab.checklist_items.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold">{tab.label}</h3>
        {tab.description && (
          <p className="mt-1 text-sm text-muted-foreground">{tab.description}</p>
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          No checklist items configured for this tab.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold">{tab.label}</h3>
      {tab.description && (
        <p className="mt-1 text-sm text-muted-foreground">{tab.description}</p>
      )}
      <div className="mt-4 space-y-4">
        {tab.checklist_items.map((item) => {
          const resp = getResponseForItem(item.id);
          const isSaving = savingItems.has(item.id);

          return (
            <div
              key={item.id}
              className={`rounded-lg border p-4 ${
                resp.is_flagged ? "border-alert-yellow bg-alert-yellow/5" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">
                      {item.label}
                      {item.is_required && (
                        <span className="ml-1 text-alert-red">*</span>
                      )}
                    </Label>
                    {isSaving && (
                      <span className="text-xs text-muted-foreground">Saving...</span>
                    )}
                    {resp.is_flagged && (
                      <span className="text-xs font-medium text-alert-yellow">Flagged</span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}

                  {/* Field rendering based on type */}
                  {isEditable ? (
                    <div className="max-w-sm">
                      {item.field_type === "checkbox" && (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={resp.value === "true"}
                            onCheckedChange={(checked) =>
                              handleValueChange(item, String(checked), null)
                            }
                          />
                          <span className="text-sm">Completed</span>
                        </div>
                      )}

                      {(item.field_type === "number" ||
                        item.field_type === "temperature" ||
                        item.field_type === "pressure") && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={resp.numeric_value ?? ""}
                            onChange={(e) => {
                              const val = e.target.value
                                ? parseFloat(e.target.value)
                                : null;
                              handleValueChange(item, e.target.value || null, val);
                            }}
                            placeholder={`Enter ${item.field_type}`}
                            min={item.min_value ?? undefined}
                            max={item.max_value ?? undefined}
                            step="0.1"
                            className="max-w-[200px]"
                          />
                          {item.unit && (
                            <span className="text-sm text-muted-foreground">
                              {item.unit}
                            </span>
                          )}
                        </div>
                      )}

                      {item.field_type === "text" && (
                        <Input
                          value={resp.value ?? ""}
                          onChange={(e) =>
                            handleValueChange(item, e.target.value || null, null)
                          }
                          placeholder="Enter value"
                        />
                      )}

                      {item.field_type === "time" && (
                        <Input
                          type="time"
                          value={resp.value ?? ""}
                          onChange={(e) =>
                            handleValueChange(item, e.target.value || null, null)
                          }
                        />
                      )}

                      {item.field_type === "select" && item.options && (
                        <select
                          value={resp.value ?? ""}
                          onChange={(e) =>
                            handleValueChange(item, e.target.value || null, null)
                          }
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">Select...</option>
                          {item.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Notes field */}
                      <Textarea
                        value={resp.notes ?? ""}
                        onChange={(e) => handleNotesChange(item.id, e.target.value)}
                        onBlur={() => handleNotesBlur(item.id)}
                        placeholder="Add notes (optional)"
                        rows={2}
                        className="mt-2"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm">
                        {item.field_type === "checkbox"
                          ? resp.value === "true"
                            ? "Completed"
                            : "Not completed"
                          : resp.value ?? resp.numeric_value ?? "--"}
                        {item.unit && resp.numeric_value !== null ? ` ${item.unit}` : ""}
                      </p>
                      {resp.notes && (
                        <p className="text-xs text-muted-foreground">
                          Notes: {resp.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
