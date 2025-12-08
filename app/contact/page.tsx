"use client";

import { FormEvent, useState } from "react";
import { useLang } from "@/components/lang-context";

export default function ContactPage() {
  const { lang } = useLang();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, message })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as any).error ||
            (lang === "zh"
              ? "提交失败，请稍后重试。"
              : "Submission failed, please try again later.")
        );
      }

      setStatus("success");
      setEmail("");
      setMessage("");
    } catch (err: any) {
      setStatus("error");
      setError(
        err.message ||
          (lang === "zh" ? "提交失败，请稍后重试。" : "Submission failed, please try again later.")
      );
    }
  }

  return (
    <div className="page">
      <h1>{lang === "zh" ? "联系我们" : "Contact Us"}</h1>
      <p>
        {lang === "zh"
          ? "如果你希望基于 FxLocus Trading 打造自己的交易品牌网站、技术解决方案或策略展示平台，可以通过以下表单留下联系方式。"
          : "If you would like to build your own trading brand site, technology solution or strategy showcase based on FxLocus Trading, leave your contact details below."}
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>{lang === "zh" ? "邮箱（必填）" : "Email (required)"}</span>
          <input
            type="email"
            required
            placeholder={lang === "zh" ? "你的邮箱地址" : "your@email.com"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="form-field">
          <span>{lang === "zh" ? "需求简要描述" : "Brief description of your needs"}</span>
          <textarea
            placeholder={
              lang === "zh"
                ? "例如：品牌官网搭建、策略展示、用户后台、订阅系统等…"
                : "e.g. brand site, strategy showcase, client portal, subscription system, etc."
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={status === "submitting"}>
          {status === "submitting"
            ? lang === "zh"
              ? "提交中…"
              : "Submitting…"
            : lang === "zh"
            ? "提交需求"
            : "Submit"}
        </button>
        {status === "success" && (
          <p className="form-success">
            {lang === "zh"
              ? "提交成功，我们会尽快与你联系。"
              : "Submitted successfully. We will get back to you soon."}
          </p>
        )}
        {status === "error" && <p className="form-error">{error}</p>}
      </form>
    </div>
  );
}
