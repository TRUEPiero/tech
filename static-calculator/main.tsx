import { createRoot } from "react-dom/client";
import "@/app/globals.css";
import "./embed.css";
import { SmartHomeCalculator } from "@/app/calculator/smart-home-calculator";
import { initialSettings } from "@/lib/calculator-defaults";

createRoot(document.getElementById("root")!).render(
  <SmartHomeCalculator defaults={initialSettings()} canEditDefaults={false} />,
);

function reportHeight() {
  window.parent.postMessage(
    { type: "technobit-calculator-height", height: document.documentElement.scrollHeight },
    window.location.origin,
  );
}

new ResizeObserver(reportHeight).observe(document.documentElement);
window.addEventListener("load", reportHeight);
document.fonts?.ready.then(reportHeight);


