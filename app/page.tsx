import {
  ArrowRight,
  Boxes,
  Clapperboard,
  CloudSun,
  Droplets,
  Factory,
  House,
  Landmark,
  Lightbulb,
  LogOut,
  MessageCircle,
  Mic,
  MoonStar,
  PanelTop,
  Power,
  Send,
  ShieldCheck,
  Smartphone,
  Thermometer,
  Users,
  Video,
  Wind,
  Zap,
} from "lucide-react";

import { VideoScenarios } from "./components/video-scenarios";
import { LeadForm } from "./components/lead-form";
import { webpSrcSet } from "./lib/responsive-image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const navigation = [
  { label: "Возможности", href: "#capabilities" },
  { label: "Сценарии", href: "#scenarios" },
  { label: "Проекты", href: "#projects" },
  { label: "Партнерство", href: "#partnership" },
  { label: "FAQ", href: "#faq" },
];

const comfortIcons = [
  { label: "Единое управление домом", icon: House },
  { label: "Управление освещением", icon: Lightbulb },
  { label: "Управление шторами", icon: PanelTop },
  { label: "Управление отоплением", icon: Thermometer },
  { label: "Вентиляция", icon: Wind },
  { label: "Поддержание влажности", icon: CloudSun },
  { label: "Защита от протечек", icon: Droplets },
  { label: "Безопасность", icon: ShieldCheck },
  { label: "Мобильное приложение", icon: Smartphone },
  { label: "Голосовое управление", icon: Mic },
];

const comfortValues = [
  {
    title: "Весь дом в телефоне",
    text: "Все системы в одном приложении.",
    icon: Smartphone,
  },
  {
    title: "Один сценарий вместо десяти действий",
    text: "«Утро», «Вечер», «Кино», «Я ушел».",
    icon: Zap,
  },
  {
    title: "Раздельный климат в доме как в автомобиле",
    text: "В каждой комнате своя температура.",
    icon: Thermometer,
  },
  {
    title: "Шторы открываются сами",
    text: "По времени, сценарию или одной кнопкой.",
    icon: PanelTop,
  },
  {
    title: "Один выключатель вместо множества кнопок и пультов",
    text: "Свет, шторы и сценарии - с одной клавиши.",
    icon: Power,
  },
  {
    title: "Защита без вашего участия",
    text: "Дом обнаружит протечку и перекроет воду.",
    icon: Droplets,
  },
];

const dayScenarios = [
  {
    title: "Утро",
    text: "Автоматический сценарий поможет просыпаться легко и естественно. Умный дом мягко включает подсветку и открывает шторы, настраивает комфортную температуру.",
    icon: CloudSun,
  },
  {
    title: "Я ушел",
    text: "Достаточно одного нажатия на выключатель в прихожей, чтобы выключить все освещение, закрыть шторы, снизить температуру и активировать систему безопасности.",
    icon: LogOut,
  },
  {
    title: "Я дома",
    text: "Одно нажатие на кнопку - и все готово к вашему приходу: дом встречает вас мягким светом, комфортной температурой и готовой атмосферой для расслабления и отдыха.",
    icon: House,
  },
  {
    title: "Гости",
    text: "Сценарий для встречи с друзьями: атмосферное освещение, климат и музыка. Автоматические датчики сделают вентиляцию оптимальной, даже если гостей много.",
    icon: Users,
  },
  {
    title: "Кино",
    text: "Кинотеатр у вас дома: сценарий включает приглушенный свет, задвигает шторы, настраивает климат и запускает AV-систему для комфортного просмотра.",
    icon: Clapperboard,
  },
  {
    title: "Ночь",
    text: "Автоматический сценарий для здорового крепкого сна: шторы закрываются, освещение постепенно меняет яркость и цвет, температура в помещении немного снижается.",
    icon: MoonStar,
  },
];

const audienceTypes = [
  {
    title: "Для квартиры",
    image: "/images/placeholders/audience-apartment.png",
    alt: "Светлая спальня в квартире",
    benefits: [
      "Ежедневное хорошее самочувствие",
      "Снижение расходов на электричество",
      "Меньше времени на рутинные действия",
      "Охрана и автоматическое управление",
    ],
  },
  {
    title: "Для загородного дома",
    image: "/images/placeholders/audience-country-house.png",
    alt: "Современный загородный дом",
    reverse: true,
    benefits: [
      "Ощутимая экономия ресурсов",
      "Удобное управление на расстоянии",
      "Постоянный контроль безопасности",
      "Дом всегда готов к вашему приезду",
    ],
  },
  {
    title: "Для апартаментов",
    image: "/images/placeholders/audience-apartments.png",
    alt: "Интерьер апартаментов с ключами",
    benefits: [
      "Контроль доступа для сдачи в аренду",
      "Снижение коммунальных расходов",
      "Постоянный мониторинг объекта",
      "Удаленное управление помещением",
    ],
  },
  {
    title: "Для коттеджа и частной виллы",
    image: "/images/placeholders/audience-villa.png",
    alt: "Современная частная вилла",
    reverse: true,
    benefits: [
      "Безопасность, контроль и приватность",
      "Интеграция всех инженерных систем",
      "Гибкие сценарии автоматизации",
      "Постоянный контроль дома из приложения",
    ],
  },
];

const processSteps = [
  {
    title: "Консультация",
    text: "Обсудим ваши пожелания и особенности проекта, предложим подходящие решения, рассчитаем стоимость и ответим на ваши вопросы.",
  },
  {
    title: "Проектирование",
    text: "На основе дизайн-проекта создадим проект умного дома с полным списком оборудования и документацией для монтажа и подключения.",
  },
  {
    title: "Сборка",
    text: "Мы заранее собираем и тестируем щит автоматизации на производстве, чтобы снизить риск ошибок и обеспечить стабильную работу на объекте.",
  },
  {
    title: "Настройка",
    text: "Сертифицированные специалисты выполнят монтаж системы, настроят сценарии автоматизации и передадут вам полностью готовый умный дом.",
  },
];

const automationLevels = [
  {
    title: "Базовый",
    price: "от 5 000 руб. за м²",
    features: [
      "Освещение",
      "Отопление",
      "Теплые полы",
      "Защита от протечек",
      "Голосовое управление",
      "Мобильное приложение для удаленного управления",
    ],
  },
  {
    title: "Расширенный",
    base: "Базовый уровень",
    price: "от 6 000 руб. за м²",
    features: ["Вентиляция", "Шторы и жалюзи", "Кондиционирование"],
  },
  {
    title: "Комплексный",
    base: "Базовый уровень",
    price: "от 12 000 руб. за м²",
    features: ["Электроустановочные изделия"],
  },
  {
    title: "Индивидуальный",
    base: "Комплексный уровень",
    price: "от 25 000 руб. за м²",
    features: ["Увлажнение", "Панели управления"],
  },
];

const completedProjects = [
  {
    title: "Гостевой дом",
    image: "/images/placeholders/project-guest-house.png",
    alt: "Интерьер гостевого дома",
    text: "В проекте реализовано освещение по датчикам движения, автоматизация штор, контроль протечек и CO₂, система увлажнения, управление теплыми полами. Комфортная и безопасная среда для отдыха без лишних забот.",
  },
  {
    title: "Квартира-студия",
    image: "/images/placeholders/project-studio.png",
    alt: "Интерьер квартиры-студии",
    text: "В проекте автоматизированы освещение, климат-контроль, безопасность, контроль CO₂ и защита от протечек. Сценарии автоматизации упрощают управление, а интерьер выглядит аккуратным без множества выключателей.",
  },
  {
    title: "Жилой квартал Lucky",
    image: "/images/placeholders/project-lucky.png",
    alt: "Фасад жилого квартала Lucky",
    text: "В 600 квартирах реализованы управление светом и отоплением, видеонаблюдение, домофония и сервисы связи с УК. Все функции комплекса объединены в единую сеть и доступны жителям в мобильном приложении.",
  },
  {
    title: "Квартира супермена",
    image: "/images/placeholders/project-superman.png",
    alt: "Темная спальня в квартире супермена",
    text: "В проекте реализовано более 20 персональных сценариев для управления светом, климатом, шторами, техникой и безопасностью. Световые сценарии помогают создать нужное настроение для работы, отдыха или вечера.",
  },
];

const partnershipTypes = [
  {
    title: "Для дизайнера",
    image: "/images/placeholders/partner-designer.png",
    alt: "Дизайнер интерьера",
    text: "Добавляйте умный дом в ваши проекты и повышайте их ценность для клиента.",
  },
  {
    title: "Для электрика",
    image: "/images/placeholders/partner-electrician.png",
    alt: "Специалист по электромонтажу",
    text: "Расширяйте список ваших услуг и выполняйте монтаж систем умного дома.",
  },
  {
    title: "Для застройщика",
    image: "/images/placeholders/partner-developer.png",
    alt: "Представитель застройщика",
    text: "Сделайте ваши новостройки более привлекательными для рынка.",
  },
  {
    title: "Для риелтора",
    image: "/images/placeholders/partner-realtor.png",
    alt: "Специалист по недвижимости",
    text: "Предлагайте своим клиентам сделать их новый дом умным и более комфортным.",
  },
];

const faqColumns = [
  [
    {
      question: "Сколько стоит умный дом?",
      answer:
        "Стоимость зависит от площади объекта, количества инженерных систем и сценариев. Базовый уровень начинается от 5 000 руб. за м². Точный расчет подготовим после обсуждения проекта.",
    },
    {
      question: "Сколько можно сэкономить с умным домом?",
      answer:
        "Экономия зависит от объекта и привычек владельцев. Автоматика помогает не расходовать лишнее тепло, электричество и воду, а прогноз можно сделать после изучения инженерных систем.",
    },
    {
      question: "Сложно ли управлять умным домом?",
      answer:
        "Нет. Основные действия выполняются привычными выключателями, панелями, голосом или через одно мобильное приложение. Часто используемые действия объединяются в готовые сценарии.",
    },
    {
      question: "Работает ли умный дом без интернета?",
      answer:
        "Да, управление внутри дома и заранее настроенные сценарии работают автономно. Интернет нужен для удаленного доступа и отдельных облачных функций, например некоторых голосовых сервисов.",
    },
    {
      question: "Можно ли автоматизировать квартиру?",
      answer:
        "Да. Умный дом можно спроектировать как для квартиры в новостройке, так и для готового жилья. Состав работ определим после консультации и осмотра объекта.",
    },
  ],
  [
    {
      question: "На каком этапе делать умный дом?",
      answer:
        "Лучше всего заложить автоматизацию на этапе дизайн-проекта, до прокладки электрики и чистовой отделки. Так все решения можно аккуратно встроить в интерьер.",
    },
    {
      question: "Можно ли добавлять функции позже?",
      answer:
        "Да, особенно если заранее предусмотреть резерв для расширения. Возможность добавить конкретную функцию после ремонта зависит от подготовленной инфраструктуры.",
    },
    {
      question: "Кто устанавливает и настраивает систему?",
      answer:
        "Команда Технобит проектирует систему, собирает и тестирует щит автоматизации, выполняет настройку и передает владельцу готовый к работе умный дом.",
    },
    {
      question: "Что делать, если что-то выйдет из строя?",
      answer:
        "Мы проводим диагностику и помогаем восстановить работу системы. Модульная архитектура позволяет обслуживать или заменить отдельный элемент без переделки всего умного дома.",
    },
    {
      question: "Сколько времени занимает монтаж системы?",
      answer:
        "Срок зависит от площади, готовности объекта и состава систем. Точный график определяем после проектирования и согласовываем до начала монтажных работ.",
    },
  ],
];

function ComfortDescription() {
  return (
    <>
      <p>
        Умный дом легко настроить под ваши привычки и образ жизни. Комфортная
        температура, свежий воздух и нужная влажность регулируются автоматически,
        а светом и шторами можно управлять одной кнопкой. Или голосом - как вам
        удобно.
      </p>
      <p>
        Автоматизация берет на себя повседневные заботы, освобождая ваше время.
        Рутинные действия выполняются автоматически, а системой можно легко
        управлять - она всегда доступна в мобильном приложении.
      </p>
    </>
  );
}

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <div className="site-shell header-inner">
          <a className="brand" href="#top" aria-label="Технобит - на главную">
            <span className="brand-name">ТЕХНОБИТ</span>
            <span className="brand-caption">умный дом</span>
          </a>

          <nav className="desktop-nav" aria-label="Основная навигация">
            {navigation.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <details className="mobile-nav">
            <summary aria-label="Открыть меню">Меню</summary>
            <nav aria-label="Мобильная навигация">
              {navigation.map((item) => (
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>
          </details>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="site-shell hero-grid">
          <div className="hero-copy">
            <h1>
              Мы делаем
              <br />
              умные дома на iRidi
            </h1>
            <p>
              Это российская платформа автоматизации
              <br className="desktop-break" /> с 18-летней историей продаж по
              всему миру
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="/calculator">
                Узнать стоимость
              </a>
              <a className="button button-secondary" href="#showroom">
                Записаться на презентацию
              </a>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <img
              src="/images/placeholders/hero-living-room.png"
              srcSet={webpSrcSet("/images/placeholders/hero-living-room.png")}
              sizes="(max-width: 767px) 100vw, (max-width: 1440px) 55vw, 790px"
              alt=""
              width="315"
              height="260"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      <section className="about-iridi">
        <div className="site-shell about-iridi-grid">
          <div className="about-iridi-copy">
            <h2>
              Сделано в России -
              <br />
              работает по всему миру
            </h2>
            <p>
              Мы делаем умные дома на базе оборудования iRidi. Это российский
              производитель систем автоматизации с 18-летней историей. Продукты
              iRidi используются в 108 странах мира: от квартир и коттеджей до
              отелей и стадионов.
            </p>
            <p>
              iRidi - это полноценная экосистема для автоматизации жилых и
              коммерческих объектов. Решениям iRidi доверяют партнеры по всему
              миру, а пользователи ценят их за комфорт, надежность и простое
              управление.
            </p>

            <div className="iridi-press">
              <span>Пресса об iRidi:</span>
              <div>
                <span>Forbes <b>→</b></span>
                <span>Пучков <b>→</b></span>
                <span>Лебедев <b>→</b></span>
              </div>
            </div>
          </div>

          <div className="iridi-proof-grid">
            <article className="iridi-proof-card">
              <h3>Отечественное производство</h3>
              <Factory aria-hidden="true" />
            </article>
            <article className="iridi-proof-card">
              <h3>Компания iRidi - резидент Сколково</h3>
              <Landmark aria-hidden="true" />
            </article>
            <article className="iridi-proof-card iridi-proof-card-wide">
              <h3>
                Оборудование и ПО
                <br />
                в реестре Минцифры РФ
              </h3>
              <Boxes aria-hidden="true" />
            </article>
          </div>
        </div>
      </section>

      <section className="comfort-section" id="capabilities">
        <div className="site-shell">
          <span className="variant-label">Вариант 1 - по макету</span>
          <div className="comfort-grid">
            <div className="comfort-image">
              <img
                src="/images/placeholders/comfort-switch.png"
                srcSet={webpSrcSet("/images/placeholders/comfort-switch.png")}
                sizes="(max-width: 767px) calc(100vw - 36px), (max-width: 1023px) 42vw, 620px"
                alt="Управление умным домом с настенного выключателя"
                width="248"
                height="247"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="comfort-copy">
              <h2>Новый уровень комфорта в вашем доме</h2>
              <ComfortDescription />
              <div className="comfort-inside">
                <h3>Что внутри умного дома</h3>
                <div className="comfort-icon-row" aria-label="Функции умного дома">
                  {comfortIcons.map((item) => {
                    const Icon = item.icon;
                    return (
                      <span className="comfort-icon" title={item.label} key={item.label}>
                        <Icon aria-hidden="true" />
                        <span className="sr-only">{item.label}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="comfort-section comfort-value-version">
        <div className="site-shell">
          <span className="variant-label">Вариант 2 - с ценностями</span>
          <div className="comfort-grid">
            <div className="comfort-image">
              <img
                src="/images/placeholders/comfort-switch.png"
                srcSet={webpSrcSet("/images/placeholders/comfort-switch.png")}
                sizes="(max-width: 767px) calc(100vw - 36px), (max-width: 1023px) 42vw, 620px"
                alt="Управление умным домом с настенного выключателя"
                width="248"
                height="247"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="comfort-copy">
              <h2>Новый уровень комфорта в вашем доме</h2>
              <ComfortDescription />
              <div className="comfort-inside">
                <h3>Что меняется для вас</h3>
                <div className="comfort-value-grid">
                  {comfortValues.map((item) => {
                    const Icon = item.icon;
                    return (
                      <article className="comfort-value" key={item.title}>
                        <Icon aria-hidden="true" />
                        <div>
                          <h4>{item.title}</h4>
                          <p>{item.text}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="day-section" id="scenarios">
        <div className="site-shell">
          <h2>Один день в умном доме</h2>
          <div className="day-scenarios-grid">
            {dayScenarios.map((scenario) => {
              const Icon = scenario.icon;
              return (
                <article className="day-scenario" key={scenario.title}>
                  <div className="day-scenario-title">
                    <Icon aria-hidden="true" />
                    <h3>{scenario.title}</h3>
                  </div>
                  <p>{scenario.text}</p>
                </article>
              );
            })}
          </div>
          <div className="day-section-footer">
            <p>
              Это лишь часть сценариев умного дома для вашего комфорта.
              <br />
              Узнайте больше о его функциях, стоимости и преимуществах.
            </p>
            <a href="#showroom">
              Записаться на презентацию
              <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <VideoScenarios />

      <section className="planning-section">
        <div className="site-shell planning-grid">
          <div className="planning-image">
            <img
              src="/images/placeholders/planning-catalog.png"
              srcSet={webpSrcSet("/images/placeholders/planning-catalog.png")}
              sizes="(max-width: 767px) calc(100vw - 36px), 50vw"
              alt="Выбор выключателей и отделочных решений для умного дома"
              width="988"
              height="988"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="planning-copy">
            <h2>Лучшее время, чтобы сделать дом умным</h2>
            <p>
              Умный дом необходимо продумать заранее - еще на этапе дизайна. Если
              ваш ремонт уже завершился, то создание полноценной автоматизации
              потребует вмешательства в готовый интерьер.
            </p>
            <p>
              Мы предоставим необходимые материалы для вашего дизайнера и
              специалиста по строительству, чтобы учесть нужные системы
              автоматизации и включить умные решения в дизайн-проект.
            </p>
          </div>
        </div>
      </section>

      <section className="showroom-section" id="showroom">
        <div className="site-shell showroom-grid">
          <div className="showroom-copy">
            <h2>Хотите увидеть работу умного дома вживую?</h2>
            <p>
              Запишитесь на персональную презентацию в шоурум. Мы покажем
              сценарии умного дома в работе, ответим на вопросы и поможем
              подобрать решения для вашего проекта.
            </p>

            <div className="showroom-address">
              <h3>Адрес</h3>
              <address>
                Екатеринбург, ул. Малышева, 8, ЦК «АРХИТЕКТОР», 3 этаж,
                кабинет 319
              </address>
              <p>Пн-Сб: 10:00-20:00, Вс: 10:00-19:00</p>
            </div>

            <a className="showroom-button" href="#contact-form">
              Записаться в шоурум
            </a>
          </div>

          <div className="showroom-image">
            <img
              src="/images/placeholders/showroom-clean.png"
              srcSet={webpSrcSet("/images/placeholders/showroom-clean.png")}
              sizes="(max-width: 767px) calc(100vw - 36px), 50vw"
              alt="Шоурум умного дома Технобит в Екатеринбурге"
              width="988"
              height="988"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      <section className="audience-section">
        <div className="site-shell">
          <h2>Почему все больше людей выбирают умный дом</h2>
          <div className="audience-list">
            {audienceTypes.map((item) => (
              <article
                className={`audience-row${item.reverse ? " audience-row-reverse" : ""}`}
                key={item.title}
              >
                <div className="audience-image">
                  <img
                    src={item.image}
                    srcSet={webpSrcSet(item.image)}
                    sizes="(max-width: 767px) calc(100vw - 36px), 50vw"
                    alt={item.alt}
                    width="988"
                    height="256"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="audience-copy">
                  <h3>{item.title}</h3>
                  <ul>
                    {item.benefits.map((benefit) => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="process-section">
        <div className="site-shell">
          <div className="process-grid">
            <div className="process-image">
              <img
                src="/images/placeholders/process-consultation.png"
                srcSet={webpSrcSet("/images/placeholders/process-consultation.png")}
                sizes="(max-width: 767px) calc(100vw - 36px), 50vw"
                alt="Специалисты Технобит настраивают умный дом"
                width="988"
                height="1012"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="process-copy">
              <h2>Как будет создаваться ваш умный дом</h2>
              <ol className="process-steps">
                {processSteps.map((step, index) => (
                  <li key={step.title}>
                    <h3>
                      {index + 1}. {step.title}
                    </h3>
                    <p>{step.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="telegram-panel">
            <div>
              <h3>Узнайте больше об умном доме</h3>
              <p>
                Переходите в наш Telegram-канал и следите за процессом создания
                умных домов, изучайте обзоры реальных проектов и узнавайте, как
                умный дом меняет повседневную жизнь его владельцев.
              </p>
            </div>
            <span className="telegram-button" aria-label="Ссылка будет добавлена позже">
              Перейти в Telegram
            </span>
          </div>
        </div>
      </section>

      <section className="automation-levels-section">
        <div className="site-shell">
          <h2>Уровни автоматизации</h2>

          <div className="automation-levels-grid">
            {automationLevels.map((level) => (
              <article className="automation-level" key={level.title}>
                <h3>{level.title}</h3>
                <div className="automation-level-content">
                  {level.base ? (
                    <>
                      <p className="automation-level-base">{level.base}</p>
                      <span className="automation-level-plus" aria-hidden="true">
                        +
                      </span>
                    </>
                  ) : null}
                  <ul>
                    {level.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
                <p className="automation-level-price">Стоимость {level.price}</p>
              </article>
            ))}
          </div>

          <div className="automation-levels-footer">
            <div>
              <p>
                Стоимость умного дома зависит от его площади. Ключевой фактор -
                объем функций, количество инженерных систем и сценариев
                автоматизации.
              </p>
              <p>
                Расскажите о своих пожеланиях - мы подготовим техническое решение
                и предложим несколько вариантов для создания вашего умного дома.
              </p>
            </div>
            <a href="/calculator">Рассчитать стоимость проекта</a>
          </div>
        </div>
      </section>

      <section className="projects-section" id="projects">
        <div className="site-shell">
          <h2>Реализованные проекты</h2>
          <div className="projects-grid">
            {completedProjects.map((project) => (
              <article className="project-card" key={project.title}>
                <div className="project-image">
                  <img
                    src={project.image}
                    srcSet={webpSrcSet(project.image)}
                    sizes="(max-width: 767px) calc(100vw - 36px), 50vw"
                    alt={project.alt}
                    width="988"
                    height="248"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <h3>{project.title}</h3>
                <p>{project.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact-form">
        <div className="site-shell contact-grid">
          <div className="contact-copy">
            <h2>Сделайте первый шаг к умному дому</h2>
            <p>
              Оставьте контакты - расскажем о возможностях умного дома,
              рассчитаем стоимость и сроки реализации.
            </p>
            <LeadForm />
          </div>

          <div className="contact-image">
            <img
              src="/images/placeholders/contact-consultant.png"
              srcSet={webpSrcSet("/images/placeholders/contact-consultant.png")}
              sizes="(max-width: 767px) calc(100vw - 36px), 50vw"
              alt="Консультация по возможностям умного дома"
              width="988"
              height="780"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      <section className="partnership-section" id="partnership">
        <div className="site-shell">
          <h2>Узнать условия партнерства</h2>
          <div className="partnership-grid">
            {partnershipTypes.map((partner) => (
              <article className="partnership-card" key={partner.title}>
                <div className="partnership-image">
                  <img
                    src={partner.image}
                    srcSet={webpSrcSet(partner.image)}
                    sizes="(max-width: 479px) calc(100vw - 28px), (max-width: 1023px) 50vw, 25vw"
                    alt={partner.alt}
                    width="738"
                    height="756"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <h3>{partner.title}</h3>
                <p>{partner.text}</p>
                <a href="#contact-form">
                  Подробнее
                  <ArrowRight aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="site-shell">
          <h2>Часто задаваемые вопросы</h2>
          <div className="faq-grid">
            {faqColumns.map((column, columnIndex) => (
              <Accordion
                className="faq-column"
                type="single"
                collapsible
                defaultValue={columnIndex === 0 ? "faq-0-3" : undefined}
                key={columnIndex}
              >
                {column.map((item, itemIndex) => (
                  <AccordionItem
                    className="faq-item"
                    value={`faq-${columnIndex}-${itemIndex}`}
                    key={item.question}
                  >
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-shell footer-grid">
          <a className="brand" href="#top" aria-label="Технобит - наверх">
            <span className="brand-name">ТЕХНОБИТ</span>
            <span className="brand-caption">студия умного дома</span>
          </a>

          <div className="footer-address">
            <strong>Шоурум в Екатеринбурге</strong>
            <span>ул. Малышева, 8, ЦК «Архитектор»</span>
          </div>

          <div className="footer-contact">
            <strong>Связаться с нами</strong>
            <a href="#contact-form">Оставить заявку</a>
          </div>

          <div className="footer-socials" aria-label="Социальные сети">
            <span title="YouTube"><Video aria-hidden="true" /></span>
            <span title="Rutube"><Clapperboard aria-hidden="true" /></span>
            <span title="ВКонтакте"><Users aria-hidden="true" /></span>
            <span title="Telegram"><Send aria-hidden="true" /></span>
            <span title="Мессенджер"><MessageCircle aria-hidden="true" /></span>
          </div>
        </div>
      </footer>
    </main>
  );
}
