'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BODY_REGIONS } from '@/lib/constants/bodyRegions';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';

interface BodyDiagramProps {
  selectedRegions: string[];
  onRegionToggle: (regionId: string) => void;
  readOnly?: boolean;
}

/* ------------------------------------------------------------------ */
/*  SVG region path definitions — front and back silhouette            */
/* ------------------------------------------------------------------ */

interface RegionPath {
  id: string;
  d: string;
}

// Front view regions — paths are drawn relative to a 200x440 viewBox
const FRONT_PATHS: RegionPath[] = [
  // Head
  { id: 'head', d: 'M85,8 Q100,0 115,8 Q125,20 120,40 L80,40 Q75,20 85,8 Z' },
  // Face
  { id: 'face', d: 'M82,40 L118,40 Q120,58 115,65 Q100,72 85,65 Q80,58 82,40 Z' },
  // Neck
  { id: 'neck', d: 'M90,65 L110,65 L112,82 L88,82 Z' },
  // Left Shoulder (viewer's left = body's right)
  { id: 'right_shoulder', d: 'M60,82 L88,82 L88,100 L55,100 Q52,90 60,82 Z' },
  // Right Shoulder
  { id: 'left_shoulder', d: 'M112,82 L140,82 Q148,90 145,100 L112,100 Z' },
  // Chest
  { id: 'chest', d: 'M68,100 L132,100 L132,145 L68,145 Z' },
  // Left Upper Arm
  { id: 'right_upper_arm', d: 'M42,100 L63,100 L58,155 L37,155 Z' },
  // Right Upper Arm
  { id: 'left_upper_arm', d: 'M137,100 L158,100 L163,155 L142,155 Z' },
  // Left Elbow
  { id: 'right_elbow', d: 'M35,155 L58,155 L55,175 L32,175 Z' },
  // Right Elbow
  { id: 'left_elbow', d: 'M142,155 L165,155 L168,175 L145,175 Z' },
  // Left Forearm
  { id: 'right_forearm', d: 'M30,175 L55,175 L50,225 L25,225 Z' },
  // Right Forearm
  { id: 'left_forearm', d: 'M145,175 L170,175 L175,225 L150,225 Z' },
  // Left Hand
  { id: 'right_hand', d: 'M22,225 L50,225 L48,255 Q35,260 20,255 Z' },
  // Right Hand
  { id: 'left_hand', d: 'M150,225 L178,225 Q180,255 165,260 L152,255 Z' },
  // Abdomen
  { id: 'abdomen', d: 'M68,145 L132,145 L132,195 L68,195 Z' },
  // Hip
  { id: 'hip', d: 'M68,195 L132,195 L135,225 L65,225 Z' },
  // Left Thigh
  { id: 'right_thigh', d: 'M65,225 L100,225 L95,300 L62,300 Z' },
  // Right Thigh
  { id: 'left_thigh', d: 'M100,225 L135,225 L138,300 L105,300 Z' },
  // Left Knee
  { id: 'right_knee', d: 'M62,300 L95,300 L93,330 L60,330 Z' },
  // Right Knee
  { id: 'left_knee', d: 'M105,300 L138,300 L140,330 L107,330 Z' },
  // Left Shin
  { id: 'right_shin', d: 'M60,330 L93,330 L90,395 L63,395 Z' },
  // Right Shin
  { id: 'left_shin', d: 'M107,330 L140,330 L137,395 L110,395 Z' },
  // Left Ankle
  { id: 'right_ankle', d: 'M63,395 L90,395 L88,415 L65,415 Z' },
  // Right Ankle
  { id: 'left_ankle', d: 'M110,395 L137,395 L135,415 L112,415 Z' },
  // Left Foot
  { id: 'right_foot', d: 'M60,415 L90,415 Q92,435 80,438 L55,435 Q52,425 60,415 Z' },
  // Right Foot
  { id: 'left_foot', d: 'M110,415 L140,415 Q148,425 145,435 L120,438 Q108,435 110,415 Z' },
];

// Back view regions — same viewBox 200x440, shifted x by 0 (rendered in second SVG)
const BACK_PATHS: RegionPath[] = [
  { id: 'head', d: 'M85,8 Q100,0 115,8 Q125,20 120,40 L80,40 Q75,20 85,8 Z' },
  { id: 'neck', d: 'M90,40 L110,40 L112,65 L88,65 Z' },
  { id: 'upper_back', d: 'M60,65 L140,65 L140,145 L60,145 Z' },
  { id: 'lower_back', d: 'M65,145 L135,145 L135,210 L65,210 Z' },
];

function RegionSVGGroup({
  paths,
  selectedRegions,
  onRegionToggle,
  readOnly,
}: {
  paths: RegionPath[];
  selectedRegions: string[];
  onRegionToggle: (id: string) => void;
  readOnly?: boolean;
}) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  return (
    <>
      {paths.map((region) => {
        const isSelected = selectedRegions.includes(region.id);
        const isHovered = hoveredRegion === region.id;

        return (
          <path
            key={region.id}
            d={region.d}
            className={cn(
              'transition-colors duration-150',
              !readOnly && 'cursor-pointer'
            )}
            fill={isSelected ? '#D32F2F' : isHovered && !readOnly ? '#FFCDD2' : 'transparent'}
            fillOpacity={isSelected ? 0.6 : isHovered ? 0.4 : 0}
            stroke={isSelected ? '#D32F2F' : '#94a3b8'}
            strokeWidth={isSelected ? 1.5 : 0.8}
            onClick={() => {
              if (!readOnly) onRegionToggle(region.id);
            }}
            onMouseEnter={() => {
              if (!readOnly) setHoveredRegion(region.id);
            }}
            onMouseLeave={() => setHoveredRegion(null)}
          />
        );
      })}
    </>
  );
}

/* Silhouette outline path for front view */
const FRONT_SILHOUETTE =
  'M100,2 Q82,2 78,20 Q74,38 78,50 Q80,62 88,68 L88,80 Q50,80 48,98 L38,100 Q30,105 28,155 Q26,175 22,220 Q18,250 20,258 Q25,265 40,258 L52,230 L55,175 L60,100 L68,95 L68,200 Q64,220 62,225 L58,300 Q56,330 58,395 Q58,415 50,435 Q58,442 78,438 L90,418 L95,330 L100,260 L105,330 L110,418 L122,438 Q142,442 150,435 Q142,415 142,395 Q144,330 142,300 L138,225 Q136,220 132,200 L132,95 L140,100 L145,175 L148,230 L160,258 Q175,265 178,258 Q182,250 178,220 L168,155 Q172,105 162,100 L152,98 Q150,80 112,80 L112,68 Q120,62 122,50 Q126,38 122,20 Q118,2 100,2 Z';

/* Silhouette outline path for back view */
const BACK_SILHOUETTE =
  'M100,2 Q82,2 78,20 Q74,38 80,55 L88,62 L88,65 Q50,65 48,80 L38,85 Q28,90 26,155 Q24,175 20,220 Q18,250 20,258 Q25,265 40,258 L52,230 L55,175 L60,85 L65,80 L65,210 Q62,225 60,240 L56,300 Q54,330 56,395 Q56,415 48,435 Q56,442 76,438 L88,418 L93,330 L100,260 L107,330 L112,418 L124,438 Q144,442 152,435 Q144,415 144,395 Q146,330 144,300 L140,240 Q138,225 135,210 L135,80 L140,85 L145,175 L148,230 L160,258 Q175,265 180,258 Q182,250 180,220 L174,155 Q172,90 162,85 L152,80 Q150,65 112,65 L112,62 L120,55 Q126,38 122,20 Q118,2 100,2 Z';

export function BodyDiagram({ selectedRegions, onRegionToggle, readOnly = false }: BodyDiagramProps) {
  const frontRegions = BODY_REGIONS.filter((r) => r.view === 'front');
  const backRegions = BODY_REGIONS.filter((r) => r.view === 'back');
  const selectedLabels = BODY_REGIONS.filter((r) => selectedRegions.includes(r.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-6 justify-center">
        {/* Front View */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Front
          </span>
          <svg
            viewBox="0 0 200 445"
            className="h-[320px] w-auto"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Silhouette outline */}
            <path
              d={FRONT_SILHOUETTE}
              fill="#f1f5f9"
              stroke="#cbd5e1"
              strokeWidth="1.2"
            />
            {/* Interactive regions */}
            <RegionSVGGroup
              paths={FRONT_PATHS}
              selectedRegions={selectedRegions}
              onRegionToggle={onRegionToggle}
              readOnly={readOnly}
            />
          </svg>
        </div>

        {/* Back View */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Back
          </span>
          <svg
            viewBox="0 0 200 445"
            className="h-[320px] w-auto"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d={BACK_SILHOUETTE}
              fill="#f1f5f9"
              stroke="#cbd5e1"
              strokeWidth="1.2"
            />
            <RegionSVGGroup
              paths={BACK_PATHS}
              selectedRegions={selectedRegions}
              onRegionToggle={onRegionToggle}
              readOnly={readOnly}
            />
          </svg>
        </div>
      </div>

      {/* Selected regions display */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {selectedLabels.map((r) => (
            <span
              key={r.id}
              className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 border border-red-200"
            >
              {r.label}
            </span>
          ))}
        </div>
      )}

      {/* Clear button */}
      {!readOnly && selectedRegions.length > 0 && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              selectedRegions.forEach((id) => onRegionToggle(id));
            }}
          >
            <Eraser className="mr-1.5 h-3.5 w-3.5" />
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}
