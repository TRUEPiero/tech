# Технобит: сайт и калькулятор

Актуальный пакет передачи от 07.09.2026. Приложение соответствует опубликованной версии 9. Калькулятор собирает этажи, комнаты, системы и управление, заполняет комнаты из шаблонов и создает JSON. Подбор оборудования и цена ожидают согласования правил.

Начать с [пакета для программиста](docs/00_START_HERE.html). Документы лежат в docs в HTML и Markdown. В готовом ZIP также есть 00_START_HERE.html в корне и PACKAGE_MANIFEST.json с точным коммитом и контрольными суммами.

## Документы

- [Перенос, запуск и API](docs/PROGRAMMER_HANDOFF.html).
- [Все 30 шаблонов комнат](docs/ROOM_DEFAULTS.html).
- [Формат JSON](docs/CONFIGURATION_JSON.html).
- [Предложения по расчету оборудования](docs/CALCULATION_PROPOSAL.html).
- [Проверки и приемка](docs/ACCEPTANCE.html).

## Локальный запуск

Node.js от 22.13, npm, Linux/WSL с Bash и GNU timeout. Python 3 нужен только для генерации документации и архива.

```bash
npm ci
npx wrangler d1 execute DB --local --config wrangler.local.jsonc --persist-to .wrangler/state --file drizzle/0000_watery_agent_brand.sql
npm run dev
```

Команда миграции применяется один раз к новой локальной базе. Калькулятор: /calculator; редактор шаблонов: /calculator/settings. Для просмотра калькулятора не нужна авторизация владельца. Запись шаблонов требует серверной идентификации и роли администратора; при переносе подключить авторизацию действующего сайта.

## Сборка и проверки

```bash
npm run build
node --test tests/calculator-defaults.test.mjs tests/calculator-api.test.mjs tests/project-configuration.test.mjs tests/rendered-html.test.mjs
```

## Стек и данные

React 19.2.6, TypeScript 5.9.3, Vinext 0.0.50, Vite 8.0.13, Cloudflare Workers + D1, Zod. Использовать package-lock.json. Нельзя загрузить исходники в каталог PHP и получить работающие серверные функции без адаптации.

Типовые комнаты: lib/calculator-room-presets.ts; после сохранения в редакторе приоритет имеет таблица calculator_settings. Конкретная конфигурация клиента хранится в памяти страницы. Скачать ее можно кнопкой «Скачать JSON».

## Состояние функций

Интерфейс, управление, шаблоны и JSON работают. Внешние интеграции не подключены. Главная форма содержит заготовку POST на два webhook-адреса; без обоих адресов возвращает demo. Запрос расчета щита формируется только в браузере. Изображения и видеозаглушки допускают последующую замену. Полная приемка на всех устройствах остается задачей переноса.

Файл .openai/hosting.json относится к исходному приватному Site. wrangler.local.jsonc служит локальной базе. Реальные секреты, доступ к размещению и содержимое рабочей базы в архив не включены.

## Обновить документы и архив

```bash
node scripts/generate-handoff-examples.mjs
python3 scripts/render-handoff-docs.py
```

Проверить результат, сохранить изменения в Git, затем выполнить:

```bash
python3 scripts/package-handoff.py /absolute/path/technobit-programmer-package-2026-09-07.zip
```
