import Link from "next/link";
import { HomeHeroGallery } from "@/components/HomeHeroGallery";

const steps = [
  {
    n: "01",
    title: "お部屋を予約",
    desc: "ご希望の日程と人数で空室を検索し、オンラインでご予約いただけます。",
  },
  {
    n: "02",
    title: "チェックイン",
    desc: "ご来館時は予約番号だけで、スムーズにチェックインできます。",
  },
  {
    n: "03",
    title: "チェックアウト",
    desc: "ご退室時にお支払い。ご滞在の締めくくりまでオンラインで完結します。",
  },
];

const services = [
  {
    href: "/reservations/lookup",
    label: "予約を確認する",
    desc: "予約番号からご予約内容を照会します。",
  },
  {
    href: "/check-in",
    label: "チェックイン",
    desc: "ご来館時のお手続きはこちら。",
  },
  {
    href: "/check-out",
    label: "チェックアウト",
    desc: "お支払いとご退室のお手続き。",
  },
  {
    href: "/reservations/cancel",
    label: "予約をキャンセル",
    desc: "ご予約の取り消しはこちら。",
  },
];

export default function Home() {
  return (
    <main className="home">
      <section className="home-hero">
        <HomeHeroGallery />
        <div className="home-hero-inner">
          <p className="home-kicker">HRS · Hotel Reservation System</p>
          <h1 className="home-title">
            西早稲田の中心で、
            <br />
            上質なご滞在を。
          </h1>
          <div className="home-cta">
            <Link className="btn btn-gold btn-lg" href="/reservations/new">
              お部屋を探す
            </Link>
            <Link className="btn btn-hero-ghost btn-lg" href="/reservations/lookup">
              予約を確認する
            </Link>
          </div>
        </div>
      </section>

      <div className="home-body">
        <section className="home-section" aria-labelledby="flow-heading">
          <p className="home-section-kicker">GUIDE</p>
          <h2 className="home-h2" id="flow-heading">
            ご利用の流れ
          </h2>
          <ol className="home-steps">
            {steps.map((step) => (
              <li className="home-step" key={step.n}>
                <span className="home-step-num">{step.n}</span>
                <span className="home-step-title">{step.title}</span>
                <span className="home-step-desc">{step.desc}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="home-section" aria-labelledby="services-heading">
          <p className="home-section-kicker">SERVICES</p>
          <h2 className="home-h2" id="services-heading">
            各種お手続き
          </h2>
          <nav className="home-services" aria-label="各種お手続き">
            {services.map((service) => (
              <Link className="service-card" href={service.href} key={service.href}>
                <span className="service-card-title">{service.label}</span>
                <span className="service-card-desc">{service.desc}</span>
                <span className="service-card-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </nav>
        </section>

        <section className="home-section" aria-labelledby="access-heading">
          <p className="home-section-kicker">ACCESS</p>
          <h2 className="home-h2" id="access-heading">
            アクセス
          </h2>
          <div className="home-access">
            <div className="home-access-info">
              <p className="home-access-name">早稲田大学 西早稲田キャンパス</p>
              <address className="home-access-address">
                〒169-8555
                <br />
                東京都新宿区大久保3丁目4番1号
              </address>
              <dl className="home-access-list">
                <div className="home-access-row">
                  <dt>電車</dt>
                  <dd>東京メトロ副都心線「西早稲田」駅 直結（2番出口）</dd>
                </div>
                <div className="home-access-row">
                  <dt>バス</dt>
                  <dd>都バス「早大正門前」停留所 徒歩 約7分</dd>
                </div>
              </dl>
            </div>
            <div className="home-access-map">
              <iframe
                src="https://www.google.com/maps?q=35.7073,139.7153&z=16&output=embed&hl=ja"
                title="西早稲田キャンパス 地図"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
