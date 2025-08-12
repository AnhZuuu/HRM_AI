"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Save } from "lucide-react";

export interface CampaignPositionDetailModel {
  type: string;
  key: string;
  value: string;
  groupIndex: number; // API example uses 0-based index
}

interface FlexibleFieldsFormProps {
  positionName: string;
  onSave?: (details: CampaignPositionDetailModel[]) => void | Promise<void>;
}

export default function FlexibleFieldsForm({ positionName, onSave }: FlexibleFieldsFormProps) {
  const [details, setDetails] = useState<CampaignPositionDetailModel[]>([]);
  const [newField, setNewField] = useState<CampaignPositionDetailModel>({
    type: "",
    key: "",
    value: "",
    groupIndex: 0,
  });
  const [saving, setSaving] = useState(false);

  const canAdd = newField.type.trim() && newField.key.trim() && newField.value.trim();

  const addField = useCallback(() => {
    if (!canAdd) return;
    setDetails((prev) => [
      ...prev,
      {
        type: newField.type.trim(),
        key: newField.key.trim(),
        value: newField.value.trim(),
        groupIndex:
          Number.isFinite(newField.groupIndex) && newField.groupIndex >= 0
            ? Math.floor(newField.groupIndex)
            : 0,
      },
    ]);
    setNewField({ type: "", key: "", value: "", groupIndex: 0 });
  }, [canAdd, newField]);

  const removeField = (index: number) => {
    setDetails((prev) => prev.filter((_, i) => i !== index));
  };

  const updateField = (index: number, field: keyof CampaignPositionDetailModel, value: string | number) => {
    setDetails((prev) =>
      prev.map((detail, i) =>
        i === index ? { ...detail, [field]: field === "groupIndex" ? normalizeGroupIndex(value) : (value as string) } : detail,
      ),
    );
  };

  const normalizeGroupIndex = (v: string | number) => {
    const n = typeof v === "number" ? v : parseInt(v as string, 10);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.floor(n);
  };

  const groupedFields = useMemo(() => {
    return details.reduce((groups, field, index) => {
      const g = normalizeGroupIndex(field.groupIndex);
      if (!groups[g]) groups[g] = [];
      groups[g].push({ ...field, originalIndex: index });
      return groups;
    }, {} as Record<number, Array<CampaignPositionDetailModel & { originalIndex: number }>>);
  }, [details]);

  const handleSave = async () => {
    if (!details.length) {
      
      return;
    }
    try {
      setSaving(true);
      await onSave?.(details);
    } finally {
      setSaving(false);
    }
  };

  const handleNewFieldKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && canAdd) {
      e.preventDefault();
      addField();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">
          Chi tiết vị trí: <span className="text-primary">{positionName}</span>
        </h1>
        <Button onClick={handleSave} className="gap-2" disabled={saving || details.length === 0}>
          <Save className="w-4 h-4" />
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>

      {/* Add New Field */}
      <Card>
        <CardHeader>
          <CardTitle>Thêm trường mới</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="new-type">
                Loại <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-type"
                placeholder="VD: Kỹ năng"
                value={newField.type}
                onChange={(e) => setNewField((prev) => ({ ...prev, type: e.target.value }))}
                onKeyDown={handleNewFieldKeyDown}
              />
            </div>

            <div>
              <Label htmlFor="new-key">
                Tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-key"
                placeholder="VD: Quản lý"
                value={newField.key}
                onChange={(e) => setNewField((prev) => ({ ...prev, key: e.target.value }))}
                onKeyDown={handleNewFieldKeyDown}
              />
            </div>

            <div>
              <Label htmlFor="new-value">
                Giá trị <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-value"
                placeholder="VD: Cơ bản"
                value={newField.value}
                onChange={(e) => setNewField((prev) => ({ ...prev, value: e.target.value }))}
                onKeyDown={handleNewFieldKeyDown}
              />
            </div>

            <div>
              <Label htmlFor="new-group">Nhóm</Label>
              <Input
                id="new-group"
                type="number"
                min={1}
                placeholder="1"
                value={newField.groupIndex}
                onChange={(e) =>
                  setNewField((prev) => ({
                    ...prev,
                    groupIndex: normalizeGroupIndex(e.target.value),
                  }))
                }
                onKeyDown={handleNewFieldKeyDown}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={addField} className="gap-2" disabled={!canAdd}>
              <Plus className="w-4 h-4" />
              Thêm trường
            </Button>
            {!canAdd && (
              <span className="text-xs text-muted-foreground">
                Điền đầy đủ Loại, Tên và Giá trị để thêm.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Fields - Grouped Display */}
      <div className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold">Các trường hiện tại</h2>

        {Object.keys(groupedFields).length === 0 && (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              Chưa có trường nào được thêm. Sử dụng form bên trên để thêm trường đầu tiên.
            </CardContent>
          </Card>
        )}

        {Object.entries(groupedFields)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([groupIndex, fields]) => (
            <Card key={groupIndex}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Nhóm {groupIndex}
                  <Badge variant="secondary">{fields.length} trường</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {fields.map((field) => (
                    <div key={field.originalIndex} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Loại</Label>
                          <Input
                            value={field.type}
                            onChange={(e) => updateField(field.originalIndex, "type", e.target.value)}
                            className="h-8"
                            placeholder="Loại"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">Tên</Label>
                          <Input
                            value={field.key}
                            onChange={(e) => updateField(field.originalIndex, "key", e.target.value)}
                            className="h-8"
                            placeholder="Tên"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">Giá trị</Label>
                          <Input
                            value={field.value}
                            onChange={(e) => updateField(field.originalIndex, "value", e.target.value)}
                            className="h-8"
                            placeholder="Giá trị"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">Nhóm</Label>
                          <Input
                            type="number"
                            min={0}
                            value={field.groupIndex}
                            onChange={(e) => updateField(field.originalIndex, "groupIndex", e.target.value)}
                            className="h-8"
                          />
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeField(field.originalIndex)}
                        className="text-red-600 hover:text-red-700"
                        aria-label="Xóa trường"
                        title="Xóa trường"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* JSON Output */}
      <Card>
        <CardHeader>
          <CardTitle>Dữ liệu JSON</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
            {JSON.stringify({ campaignPositionDetailAddModels: details }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
