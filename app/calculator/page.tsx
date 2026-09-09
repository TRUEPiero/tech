import type { Metadata } from "next";
import { SmartHomeCalculator } from "./smart-home-calculator";
import { getCalculatorAccess, getCalculatorDefaults } from "@/lib/calculator-settings-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Калькулятор умного дома - Технобит",
  description:
    "Соберите предварительную конфигурацию систем умного дома по этажам и помещениям.",
};

export default async function CalculatorPage() {
  let config;
  try {
    config = await Promise.all([getCalculatorDefaults(), getCalculatorAccess()]);
  } catch (error) {
    console.error("Unable to open calculator", error);
    return <main className="calculator-page"><div className="calculator-shell calculator-main">
      <section className="calculator-section">
        <h1>Не удалось загрузить калькулятор</h1>
        <p>Типовые комплектации временно недоступны. Попробуйте обновить страницу.</p>
        <a href="/calculator">Обновить страницу</a>
      </section>
    </div></main>;
  }
  const [defaults, access] = config;
  return <SmartHomeCalculator defaults={defaults} canEditDefaults={access.canEdit} />;
}
