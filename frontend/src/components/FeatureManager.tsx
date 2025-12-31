import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { featuresApi } from '@/lib/api';
import { FeatureEditDialog } from '@/components/dialogs/features/FeatureEditDialog';
import type { Feature } from 'shared/types';

interface FeatureManagerProps {
  projectId: string;
}

export function FeatureManager({ projectId }: FeatureManagerProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeatures = useCallback(async () => {
    setLoading(true);
    try {
      const data = await featuresApi.list(projectId);
      setFeatures(data);
    } catch (err) {
      console.error('Failed to fetch features:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const handleOpenDialog = useCallback(
    async (feature?: Feature) => {
      try {
        const result = await FeatureEditDialog.show({
          feature: feature || null,
          projectId,
        });

        if (result.action === 'saved') {
          await fetchFeatures();
        }
      } catch (error) {
        // User cancelled - do nothing
      }
    },
    [fetchFeatures, projectId]
  );

  const handleDelete = useCallback(
    async (feature: Feature) => {
      if (
        !confirm(
          `Are you sure you want to delete the feature "${feature.name}"?\n\nTasks will not be deleted, but they will no longer be associated with this feature.`
        )
      ) {
        return;
      }

      try {
        await featuresApi.delete(feature.id);
        await fetchFeatures();
      } catch (err) {
        console.error('Failed to delete feature:', err);
      }
    },
    [fetchFeatures]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Features</h3>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Feature
        </Button>
      </div>

      {features.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No features yet. Create one to start organizing your tasks.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[400px] overflow-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-2 text-sm font-medium">Name</th>
                  <th className="text-right p-2 text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature) => (
                  <tr
                    key={feature.id}
                    className="border-b hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-2 text-sm font-medium">{feature.name}</td>
                    <td className="p-2">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleOpenDialog(feature)}
                          title="Edit feature"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDelete(feature)}
                          title="Delete feature"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
