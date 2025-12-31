import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { featuresApi } from '@/lib/api';
import type { Feature, CreateFeature, UpdateFeature } from 'shared/types';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal, getErrorMessage } from '@/lib/modals';

export interface FeatureEditDialogProps {
  feature?: Feature | null;
  projectId: string;
}

export type FeatureEditResult =
  | { action: 'saved'; feature: Feature }
  | { action: 'canceled' };

const FeatureEditDialogImpl = NiceModal.create<FeatureEditDialogProps>(
  ({ feature, projectId }) => {
    const modal = useModal();
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEditMode = Boolean(feature);

    useEffect(() => {
      if (feature) {
        setName(feature.name);
      } else {
        setName('');
      }
      setError(null);
    }, [feature]);

    const handleSave = async () => {
      if (!name.trim()) {
        setError('Feature name is required');
        return;
      }

      setSaving(true);
      setError(null);

      try {
        let savedFeature: Feature;
        if (isEditMode && feature) {
          const updateData: UpdateFeature = {
            name: name.trim(),
          };
          savedFeature = await featuresApi.update(feature.id, updateData);
        } else {
          const createData: CreateFeature = {
            project_id: projectId,
            name: name.trim(),
          };
          savedFeature = await featuresApi.create(createData);
        }

        modal.resolve({ action: 'saved', feature: savedFeature });
        modal.hide();
      } catch (err: unknown) {
        setError(getErrorMessage(err) || 'Failed to save feature');
      } finally {
        setSaving(false);
      }
    };

    const handleCancel = () => {
      modal.resolve({ action: 'canceled' });
      modal.hide();
    };

    const handleOpenChange = (open: boolean) => {
      if (!open) {
        setName('');
        setError(null);
        handleCancel();
      }
    };

    return (
      <Dialog open={modal.visible} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[400px] z-[10001]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Feature' : 'Create Feature'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="feature-name">
                Feature Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="feature-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., User Authentication"
                disabled={saving}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSave();
                  }
                }}
              />
            </div>
            {error && <Alert variant="destructive">{error}</Alert>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

export const FeatureEditDialog = defineModal<
  FeatureEditDialogProps,
  FeatureEditResult
>(FeatureEditDialogImpl);
