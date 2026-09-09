import { leadSchema } from "@/app/lib/lead-schema";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const result = leadSchema.safeParse(body);
  if (!result.success || result.data.website) {
    return Response.json({ error: "invalid_form" }, { status: 400 });
  }

  const bitrixWebhookUrl = process.env.BITRIX_WEBHOOK_URL;
  const emailWebhookUrl = process.env.LEAD_EMAIL_WEBHOOK_URL;

  if (!bitrixWebhookUrl || !emailWebhookUrl) {
    return Response.json({ ok: true, demo: true });
  }

  const lead = {
    name: result.data.name,
    phone: result.data.phone,
    email: result.data.email || null,
    source: "technobit-site",
    consent: true,
    createdAt: new Date().toISOString(),
  };

  try {
    const [bitrixResponse, emailResponse] = await Promise.all([
      fetch(bitrixWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      }),
      fetch(emailWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      }),
    ]);

    if (!bitrixResponse.ok || !emailResponse.ok) {
      return Response.json({ error: "delivery_failed" }, { status: 502 });
    }
  } catch {
    return Response.json({ error: "delivery_failed" }, { status: 502 });
  }

  return Response.json({ ok: true, demo: false });
}
