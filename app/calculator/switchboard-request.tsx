"use client";

import { useState } from "react";
import { Download, FileJson, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { configurationExport, requestContactSchema, type ConfigurationExport, type ContactChannel, type RequestContact, type SelectedConfiguration } from "@/lib/project-configuration";

const CHANNELS = [
  { value: "email", label: "Email", placeholder: "name@example.com" },
  { value: "telegram", label: "Telegram", placeholder: "@username" },
  { value: "whatsapp", label: "WhatsApp", placeholder: "+7 900 123-45-67" },
] as const;

export function SwitchboardRequest({ configuration }: { configuration: SelectedConfiguration }) {
  const [formOpen, setFormOpen] = useState(false);
  const [channel, setChannel] = useState<ContactChannel>("email");
  const [contactValues, setContactValues] = useState<Record<ContactChannel, string>>({ email: "", telegram: "", whatsapp: "" });
  const [consent, setConsent] = useState(false);
  const [contact, setContact] = useState<RequestContact | null>(null);
  const [error, setError] = useState("");
  const [prepared, setPrepared] = useState(false);
  const [preview, setPreview] = useState<ConfigurationExport | null>(null);
  const selectedChannel = CHANNELS.find((item) => item.value === channel)!;

  function prepareRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configuration.areaM2 || configuration.totals.rooms === 0) {
      setError("Укажите площадь объекта и добавьте хотя бы одну комнату в калькуляторе.");
      return;
    }
    if (!consent) { setError("Подтвердите согласие на обработку данных."); return; }
    const result = requestContactSchema.safeParse({ channel, value: contactValues[channel], consent });
    if (!result.success) { setError(result.error.issues[0]?.message ?? "Проверьте контакт."); return; }
    setContact(result.data);
    setPrepared(true);
    setError("");
    setFormOpen(false);
    setPreview(configurationExport(configuration, result.data));
  }

  function download() {
    const document = configurationExport(configuration, contact);
    const url = URL.createObjectURL(new Blob([JSON.stringify(document, null, 2) + "\n"], { type: "application/json;charset=utf-8" }));
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `technobit-configuration-${document.generatedAt.slice(0, 19).replace(/[:T]/g, "-")}.json`;
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className="switchboard-section" aria-labelledby="switchboard-title">
      <div className="switchboard-copy">
        <h2 id="switchboard-title">Щит электрики и автоматики</h2>
        <p>Получите состав и стоимость самого щита для вашего объекта.</p>
        <ul>
          <li>Автоматы и устройства защиты.</li>
          <li>Оборудование автоматики и блоки питания.</li>
          <li>Клеммы и внутренняя коммутация.</li>
          <li>Рама и корпус щита.</li>
        </ul>
        <p className="switchboard-scope">Расчет щита готовится отдельно от предварительной стоимости умного дома.</p>
      </div>
      <div className="switchboard-actions">
        <Button type="button" onClick={() => { setError(""); setFormOpen(true); }}>Получить полный расчет по электрике</Button>
        <p>Выберите, куда вам удобно получить расчет: email, Telegram или WhatsApp.</p>
        <p className="prototype-notice">В этой версии данные никуда не отправляются. Заполненную конфигурацию можно посмотреть и скачать.</p>
        <div className="configuration-file-actions">
          <Button type="button" variant="outline" onClick={() => setPreview(configurationExport(configuration, contact))}><FileJson />Посмотреть JSON</Button>
          <Button type="button" variant="outline" onClick={download}><Download />Скачать JSON</Button>
        </div>
        {prepared && <p role="status" className="request-prepared">Конфигурация подготовлена. Файл содержит текущие параметры объекта и выбранный контакт. Отправка не выполнялась.</p>}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="calculator-dialog" showCloseButton={false}>
          <DialogClose asChild><Button type="button" variant="ghost" size="icon" className="calculator-dialog-close" aria-label="Закрыть форму"><X /></Button></DialogClose>
          <DialogHeader><DialogTitle>Полный расчет щита</DialogTitle><DialogDescription>Выберите один способ получения расчета и укажите контакт.</DialogDescription></DialogHeader>
          <form className="switchboard-form" onSubmit={prepareRequest} noValidate>
            <RadioGroup className="contact-channel-choices" value={channel} aria-label="Способ получения расчета" onValueChange={(value) => { setChannel(value as ContactChannel); setError(""); }}>
              {CHANNELS.map((item) => <label key={item.value} htmlFor={`contact-${item.value}`} data-selected={channel === item.value}>
                <RadioGroupItem id={`contact-${item.value}`} value={item.value} />{item.label}
              </label>)}
            </RadioGroup>
            <label htmlFor="switchboard-contact">{selectedChannel.label}</label>
            <Input id="switchboard-contact" className="calculator-input" type={channel === "email" ? "email" : channel === "whatsapp" ? "tel" : "text"}
              autoComplete={channel === "email" ? "email" : channel === "whatsapp" ? "tel" : "off"}
              placeholder={selectedChannel.placeholder} maxLength={254} value={contactValues[channel]}
              onChange={(event) => { setContactValues((current) => ({ ...current, [channel]: event.target.value })); setError(""); }}
              required aria-invalid={Boolean(error)} aria-describedby={error ? "switchboard-error" : undefined} />
            <label className="switchboard-consent" htmlFor="switchboard-consent">
              <Checkbox id="switchboard-consent" checked={consent} onCheckedChange={(value) => setConsent(value === true)} />
              <span>Согласен на обработку данных для подготовки расчета.</span>
            </label>
            <p className="prototype-notice">Сейчас будет подготовлен JSON-файл. Отправка сообщения не выполняется.</p>
            {error && <p id="switchboard-error" className="calculator-field-error" role="alert">{error}</p>}
            <Button type="submit">Подготовить конфигурацию</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={preview !== null} onOpenChange={(open) => { if (!open) setPreview(null); }}>
        <DialogContent className="calculator-dialog json-dialog" showCloseButton={false}>
          <DialogClose asChild><Button type="button" variant="ghost" size="icon" className="calculator-dialog-close" aria-label="Закрыть JSON"><X /></Button></DialogClose>
          <DialogHeader><DialogTitle>Конфигурация в JSON</DialogTitle><DialogDescription>Этажи, комнаты, выбранные системы и контакт для расчета щита, если он указан. Файл можно передать в другую программу позднее.</DialogDescription></DialogHeader>
          <pre className="configuration-json" tabIndex={0} aria-label="Содержимое JSON">{preview && JSON.stringify(preview, null, 2)}</pre>
          <Button type="button" onClick={download}><Download />Скачать JSON</Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
