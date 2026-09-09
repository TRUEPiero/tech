import { getRawDb } from "@/db";
import { settingsUpdateSchema } from "@/lib/calculator-defaults";
import { getCalculatorAccess, getCalculatorDefaults } from "@/lib/calculator-settings-server";
import { saveRoomDefaults } from "@/lib/calculator-settings-store";

export const dynamic = "force-dynamic";
const responseHeaders = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    return Response.json(await getCalculatorDefaults(), { headers: responseHeaders });
  } catch (error) {
    console.error("Unable to load calculator defaults", error);
    return Response.json({ error: "Не удалось загрузить типовые комплектации." }, { status: 503, headers: responseHeaders });
  }
}

export async function PUT(request: Request) {
  const access = await getCalculatorAccess();
  if (!access.canEdit || !access.identity) {
    return Response.json({ error: "Редактирование доступно владельцу калькулятора." }, { status: 403, headers: responseHeaders });
  }
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ error: "Запрос должен быть отправлен со страницы настроек." }, { status: 403, headers: responseHeaders });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json({ error: "Неверный формат данных." }, { status: 415, headers: responseHeaders });
  }
  if (Number(request.headers.get("content-length") ?? 0) > 65536) {
    return Response.json({ error: "Слишком большой объем данных." }, { status: 413, headers: responseHeaders });
  }
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 65536) return Response.json({ error: "Слишком большой объем данных." }, { status: 413, headers: responseHeaders });
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "Неверный формат данных." }, { status: 400, headers: responseHeaders });
  }
  const parsed = settingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Заполните все комнаты. Количество должно быть целым числом от 0 до 100." }, { status: 400, headers: responseHeaders });
  }
  try {
    const { revision, ...content } = parsed.data;
    const saved = await saveRoomDefaults(getRawDb(), content, revision, access.identity.id);
    if (!saved) {
      return Response.json({ error: "Таблица уже изменена в другой вкладке. Обновите ее перед повторным сохранением." }, { status: 409, headers: responseHeaders });
    }
    return Response.json(saved, { headers: responseHeaders });
  } catch (error) {
    console.error("Unable to save calculator defaults", error);
    return Response.json({ error: "Не удалось сохранить изменения. Ваши значения остались в таблице. Попробуйте еще раз." }, { status: 503, headers: responseHeaders });
  }
}
