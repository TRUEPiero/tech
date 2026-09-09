"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NUMERIC_FIELDS, roomDefaultsConfigSchema, settingsUpdateSchema, type NumericPresetKey, type RoomDefaultsConfig, type RoomPreset } from "@/lib/calculator-defaults";
import { PresenceChoice } from "../presence-choice";
import { RoomControlFields } from "../room-control-fields";

type DraftRoom = Omit<RoomPreset, NumericPresetKey> & Record<NumericPresetKey, string>;

function draftRows(config: RoomDefaultsConfig): DraftRoom[] {
  return config.rooms.map((row) => {
    const quantities = Object.fromEntries(
      NUMERIC_FIELDS.map(({ key }) => [key, String(row[key])]),
    ) as Record<NumericPresetKey, string>;
    return { roomType: row.roomType, airConditioner: row.airConditioner, controls: { ...row.controls }, ...quantities };
  });
}

const GROUPS = [
  { key: "lighting", label: "Свет" },
  { key: "heating", label: "Отопление" },
  { key: "sensors", label: "Датчики" },
  { key: "curtains", label: "Шторы" },
  { key: "air-conditioning", label: "Кондиционеры" },
  { key: "controls", label: "Управление" },
] as const;

export function RoomDefaultsEditor({ initialConfig }: { initialConfig: RoomDefaultsConfig }) {
  const [rows, setRows] = useState(() => draftRows(initialConfig));
  const [ventilation, setVentilation] = useState(initialConfig.ventilation);
  const [revision, setRevision] = useState(initialConfig.revision);
  const [baseline, setBaseline] = useState(() => JSON.stringify({ rows: draftRows(initialConfig), ventilation: initialConfig.ventilation }));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null);
  const dirty = JSON.stringify({ rows, ventilation }) !== baseline;

  function updateRoom(roomType: string, patch: Partial<DraftRoom>) {
    setRows((current) => current.map((row) => row.roomType === roomType ? { ...row, ...patch } : row));
    setFeedback(null);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = settingsUpdateSchema.safeParse({
      revision, ventilation,
      rooms: rows.map((row) => ({ ...row,
        ...Object.fromEntries(NUMERIC_FIELDS.map(({ key }) => [key, row[key].trim() === "" ? null : Number(row[key])])),
      })),
    });
    if (!parsed.success) {
      setFeedback({ error: true, message: "Заполните все значения целыми числами от 0 до 100." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/calculator-defaults", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await response.json();
      if (!response.ok) {
        const message = body && typeof body === "object" && "error" in body && typeof body.error === "string"
          ? body.error : "Не удалось сохранить изменения. Попробуйте еще раз.";
        throw new Error(message);
      }
      const saved = roomDefaultsConfigSchema.parse(body);
      const savedRows = draftRows(saved);
      setRows(savedRows);
      setVentilation(saved.ventilation);
      setRevision(saved.revision);
      setBaseline(JSON.stringify({ rows: savedRows, ventilation: saved.ventilation }));
      setFeedback({ error: false, message: "Сохранено. При следующем открытии калькулятора новые комнаты получат эти значения." });
    } catch (error) {
      setFeedback({ error: true, message: error instanceof Error ? error.message : "Не удалось сохранить изменения. Попробуйте еще раз." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="calculator-page">
      <header className="calculator-header"><div className="calculator-shell calculator-header-inner">
        <Link className="brand" href="/"><span className="brand-name">ТЕХНОБИТ</span><span className="brand-caption">умный дом</span></Link>
        <Button asChild variant="ghost"><a href="/calculator"><ArrowLeft />В калькулятор</a></Button>
      </div></header>
      <div className="calculator-shell calculator-main defaults-editor">
        <section className="defaults-intro">
          <h1>Типовые комнаты</h1>
          <p>Эти значения заполняются при добавлении комнаты. Начальный набор составлен как рабочее предположение. Поправьте его по вашей практике.</p>
        </section>
        <form onSubmit={save} noValidate>
          <section className="calculator-section defaults-general">
            <div><h2>Вентустановка</h2><p>Значение по умолчанию для нового объекта.</p></div>
            <PresenceChoice id="default-ventilation" label="Вентустановка по умолчанию" value={ventilation}
              onChange={(value) => { setVentilation(value); setFeedback(null); }} disabled={saving} />
          </section>
          <section className="calculator-section systems-section">
            <div className="calculator-section-heading"><div><h2>Набор для каждой комнаты</h2></div>
              <p>Количество групп и датчиков. Для протечек - количество мокрых зон.</p>
            </div>
            <Tabs defaultValue="lighting" className="systems-tabs">
              <div className="tabs-scroll"><TabsList className="systems-tabs-list">
                {GROUPS.map((group) => <TabsTrigger key={group.key} value={group.key}>{group.label}</TabsTrigger>)}
              </TabsList></div>
              {GROUPS.map((group) => {
                if (group.key === "controls") return <TabsContent value="controls" key="controls" className="system-panel">
                  <p className="control-selection-note">Начальный выбор: P4 в прихожей и коридоре. В остальных комнатах при сумме групп света больше 3 или числе штор больше 2 - выключатель на 4 клавиши. Здесь можно изменить этот выбор. Правки света и штор не перезаписывают управление автоматически.</p>
                  {rows.map((row, index) => <div className="control-room-row" key={row.roomType}>
                    <div className="control-room-name"><strong>{row.roomType}</strong></div>
                    <RoomControlFields id={`default-controls-${index}`} label={row.roomType} value={row.controls}
                      onChange={(controls) => updateRoom(row.roomType, { controls })} disabled={saving} />
                  </div>)}
                </TabsContent>;
                const fields = NUMERIC_FIELDS.filter((field) => field.system === group.key);
                const isAirConditioning = group.key === "air-conditioning";
                return <TabsContent value={group.key} key={group.key} className="system-panel">
                  <Table className="defaults-table">
                    <TableHeader><TableRow><TableHead>Помещение</TableHead>
                      {fields.map((field) => <TableHead key={field.key}>{field.label}</TableHead>)}
                      {isAirConditioning && <TableHead>Кондиционер</TableHead>}
                    </TableRow></TableHeader>
                    <TableBody>{rows.map((row, index) => <TableRow key={row.roomType}>
                      <TableCell className="defaults-room-name">{row.roomType}</TableCell>
                      {fields.map((field) => <TableCell key={field.key}>
                        <Input className="defaults-quantity" type="number" inputMode="numeric" min={0} max={100} step={1}
                          aria-label={`${row.roomType}: ${field.label}`} value={row[field.key]} disabled={saving}
                          onChange={(event) => updateRoom(row.roomType, { [field.key]: event.target.value })} />
                      </TableCell>)}
                      {isAirConditioning && <TableCell><PresenceChoice id={`default-ac-${index}`} label={`${row.roomType}: кондиционер`}
                        value={row.airConditioner} onChange={(airConditioner) => updateRoom(row.roomType, { airConditioner })} disabled={saving} /></TableCell>}
                    </TableRow>)}</TableBody>
                  </Table>
                </TabsContent>;
              })}
            </Tabs>
          </section>
          <div className="defaults-save-bar">
            <div>
              <p>Изменения применяются к новым комнатам после следующего открытия калькулятора.</p>
              {feedback && <p className={feedback.error ? "defaults-error" : "defaults-success"} role={feedback.error ? "alert" : "status"}>{feedback.message}</p>}
            </div>
            <Button type="submit" disabled={saving || !dirty}><Save />{saving ? "Сохранение..." : "Сохранить изменения"}</Button>
          </div>
        </form>
      </div>
    </main>
  );
}
