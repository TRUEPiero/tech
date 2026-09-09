import type { Metadata } from "next";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { getCalculatorAccess, getCalculatorDefaults } from "@/lib/calculator-settings-server";
import { RoomDefaultsEditor } from "./room-defaults-editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Типовые комнаты - Технобит" };

export default async function CalculatorSettingsPage() {
  await requireChatGPTUser("/calculator/settings");
  const access = await getCalculatorAccess();
  if (!access.canEdit) {
    return <main className="calculator-page"><div className="calculator-shell calculator-main">
      <section className="calculator-section"><h1>Типовые комнаты</h1>
        <p>Редактирование доступно владельцу калькулятора.</p>
        <a href="/calculator">Вернуться в калькулятор</a>
      </section>
    </div></main>;
  }
  let config;
  try {
    config = await getCalculatorDefaults();
  } catch (error) {
    console.error("Unable to open calculator settings", error);
    return <main className="calculator-page"><div className="calculator-shell calculator-main">
      <section className="calculator-section"><h1>Типовые комнаты</h1>
        <p>Не удалось загрузить таблицу. Попробуйте обновить страницу.</p>
        <a href="/calculator/settings">Обновить страницу</a>
      </section>
    </div></main>;
  }
  return <RoomDefaultsEditor initialConfig={config} />;
}
