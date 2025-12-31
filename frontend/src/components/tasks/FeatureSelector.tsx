import { Tag, ArrowDown, PlusCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { FeatureEditDialog } from '@/components/dialogs/features/FeatureEditDialog';
import type { Feature } from 'shared/types';

interface FeatureSelectorProps {
  features: Feature[];
  selectedFeatureId: string | null;
  onFeatureSelect: (featureId: string | null) => void;
  projectId: string;
  onFeaturesChange?: () => void;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function FeatureSelector({
  features,
  selectedFeatureId,
  onFeatureSelect,
  projectId,
  onFeaturesChange,
  disabled,
  showLabel = true,
  className = '',
}: FeatureSelectorProps) {
  const selectedFeature = features.find((f) => f.id === selectedFeatureId);

  const handleCreateNew = async () => {
    try {
      const result = await FeatureEditDialog.show({
        feature: null,
        projectId,
      });

      if (result.action === 'saved') {
        // Auto-select the newly created feature
        onFeatureSelect(result.feature.id);
        // Notify parent to refresh features list
        onFeaturesChange?.();
      }
    } catch (error) {
      // User cancelled - do nothing
    }
  };

  return (
    <div className={className}>
      {showLabel && (
        <Label htmlFor="feature-selector" className="text-sm font-medium">
          Feature
        </Label>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-between h-9 ${showLabel ? 'mt-1.5' : ''}`}
            disabled={disabled}
            aria-label="Select feature"
          >
            <div className="flex items-center gap-1.5 w-full">
              <Tag className="h-3 w-3" />
              <span className="truncate">
                {selectedFeature ? selectedFeature.name : 'No Feature'}
              </span>
            </div>
            <ArrowDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60">
          {selectedFeatureId && (
            <>
              <DropdownMenuItem
                onClick={() => onFeatureSelect(null)}
                className="text-muted-foreground"
              >
                <X className="h-3 w-3 mr-2" />
                Clear Selection
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {features.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground text-center">
              No features yet
            </div>
          ) : (
            features.map((feature) => (
              <DropdownMenuItem
                key={feature.id}
                onClick={() => onFeatureSelect(feature.id)}
                className={
                  selectedFeatureId === feature.id ? 'bg-accent' : ''
                }
              >
                {feature.name}
              </DropdownMenuItem>
            ))
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCreateNew}>
            <PlusCircle className="h-3 w-3 mr-2" />
            Create New Feature
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
