"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/lang-context";

const CAMPAIGN_START = new Date("2025-03-10T00:00:00+08:00");
const CAMPAIGN_DAYS = 90;
const BASE_DONATION = 1874; // 美元起始展示
const DAILY_INCREMENT = 5; // 每天增加的展示金额

function calcCountdown() {
  const end = new Date(CAMPAIGN_START.getTime() + CAMPAIGN_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = Math.max(0, end.getTime() - now.getTime());

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

function calcDonationAmount() {
  const now = new Date();
  const diff = now.getTime() - CAMPAIGN_START.getTime();
  if (diff <= 0) return BASE_DONATION;
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  return BASE_DONATION + days * DAILY_INCREMENT;
}

export default function DonatePage() {
  const { lang } = useLang();
  const isZh = lang === "zh";

  const [countdown, setCountdown] = useState(calcCountdown);
  const [amount, setAmount] = useState(calcDonationAmount);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calcCountdown());
      setAmount(calcDonationAmount());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const ethAddress = "0xd3218eae9734dbd39fe35d493df728e8488ba40e";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ethAddress);
      alert(isZh ? "地址已复制到剪贴板" : "Address copied to clipboard");
    } catch {
      alert(isZh ? "复制失败，请手动选择复制。" : "Copy failed, please copy manually.");
    }
  };

  return (
    <div className="donate-page">
      <section className="donate-card">
        <h1 className="donate-title">
          {isZh ? "立刻捐赠，成为会员！" : "Donate now & become a member!"}
        </h1>

        <p className="donate-paragraph">
          {isZh ? (
            <>
              自 2025 年 3 月 10 日起全球范围接受捐赠成为 90 天试用会员。数量 $999 个（仅接受
              USDT/USDC）起，捐赠将被视为私人自愿行为且无任何承诺和商业约束力，但可参与会员社区的顶尖交易员集训
              + 21 天获救陪跑，成绩优异可自愿参与挑战、挑战成功。
            </>
          ) : (
            <>
              From March 10th 2025 we accept global donations to join a 90‑day trial membership. Minimum
              contribution is $999 (USDT/USDC only). Donations are voluntary and non‑contractual, but give
              access to our member community, elite trader bootcamp and 21‑day mentoring challenge.
            </>
          )}
        </p>

        <p className="donate-paragraph">
          {isZh ? "权益示例：" : "Member benefits include:"}
          <br />
          {isZh
            ? "(1) 终身进阶实训 (2) 1–20 万模拟奖学金 (3) 顶尖矩阵俱乐部"
            : "(1) Lifetime advanced training (2) 10k–200k simulated capital challenges (3) Elite matrix club"}
        </p>

        <p className="donate-paragraph">
          {isZh ? "国际会员钱包地址：" : "Wallet address for international members:"}{" "}
          <span className="donate-emphasis">(ERC20 / ETH)</span>
          <br />
          <span className="donate-address" onClick={handleCopy}>
            {ethAddress}
          </span>
          <button className="btn btn-outline donate-copy" type="button" onClick={handleCopy}>
            {isZh ? "复制地址" : "Copy address"}
          </button>
        </p>

        <p className="donate-paragraph">
          {isZh
            ? "中国大陆会员仅接受数字人民币捐赠，以提供实物或奖学金方式鼓励，详情请联系邮箱。"
            : "Mainland China members can donate in digital RMB and receive benefits in the form of materials or scholarships. For details, please contact us via email."}
        </p>

        <h2 className="donate-subtitle">{isZh ? "倒计时" : "Countdown"}</h2>

        <p className="donate-countdown">
          {isZh ? (
            <>
              {countdown.days} 天 {countdown.hours} 小时 {countdown.minutes} 分钟 {countdown.seconds} 秒
            </>
          ) : (
            <>
              {countdown.days} d {countdown.hours} h {countdown.minutes} m {countdown.seconds} s
            </>
          )}
        </p>

        <p className="donate-paragraph">
          {isZh
            ? `当前捐赠数量（每天增加 $${DAILY_INCREMENT}）：$${amount}`
            : `Current displayed donations (grows $${DAILY_INCREMENT} per day): $${amount}`}
        </p>

        <a href="/contact" className="btn btn-primary donate-cta">
          {isZh ? "加入我们" : "Join us"}
        </a>
      </section>
    </div>
  );
}
