"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { leadSchema, type LeadFormValues } from "@/app/lib/lead-schema";

type SubmissionState = "idle" | "sending" | "success" | "demo" | "error";

export function LeadForm() {
  const [submissionState, setSubmissionState] =
    useState<SubmissionState>("idle");

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      consent: false,
      website: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmissionState("sending");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Lead delivery failed");

      const data = (await response.json()) as { demo?: boolean };

      reset();
      setSubmissionState(data.demo ? "demo" : "success");
    } catch {
      setSubmissionState("error");
    }
  });

  return (
    <form className="lead-form" onSubmit={onSubmit} noValidate>
      <div className="lead-field">
        <label className="sr-only" htmlFor="lead-name">
          Имя
        </label>
        <Input
          id="lead-name"
          placeholder="Имя"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
        {errors.name ? <span>{errors.name.message}</span> : null}
      </div>

      <div className="lead-field">
        <label className="sr-only" htmlFor="lead-phone">
          Телефон
        </label>
        <Input
          id="lead-phone"
          type="tel"
          inputMode="tel"
          placeholder="Телефон"
          autoComplete="tel"
          aria-invalid={Boolean(errors.phone)}
          {...register("phone")}
        />
        {errors.phone ? <span>{errors.phone.message}</span> : null}
      </div>

      <div className="lead-field">
        <label className="sr-only" htmlFor="lead-email">
          Email
        </label>
        <Input
          id="lead-email"
          type="email"
          inputMode="email"
          placeholder="Email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email ? <span>{errors.email.message}</span> : null}
      </div>

      <div className="lead-honeypot" aria-hidden="true">
        <label htmlFor="lead-website">Сайт</label>
        <input
          id="lead-website"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      <Controller
        name="consent"
        control={control}
        render={({ field }) => (
          <div className="lead-consent">
            <Checkbox
              id="lead-consent"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              aria-invalid={Boolean(errors.consent)}
            />
            <div>
              <label htmlFor="lead-consent">
                Я согласен на обработку персональных данных
              </label>
              {errors.consent ? <span>{errors.consent.message}</span> : null}
            </div>
          </div>
        )}
      />

      <Button type="submit" disabled={submissionState === "sending"}>
        {submissionState === "sending"
          ? "Отправляем..."
          : "Получить консультацию"}
      </Button>

      <div className="lead-form-status" aria-live="polite">
        {submissionState === "success"
          ? "Заявка отправлена. Мы свяжемся с вами в ближайшее время."
          : null}
        {submissionState === "demo"
          ? "Форма работает в демонстрационном режиме. Подключение отправки будет добавлено позднее."
          : null}
        {submissionState === "error"
          ? "Не удалось отправить заявку. Попробуйте еще раз позднее."
          : null}
      </div>
    </form>
  );
}
