"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/lang-context";

const DEFAULT_USER = {
  username: "admin",
  password: "123456"
};

export default function TradeSystemLogin() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const { lang } = useLang();
  const isZh = lang === "zh";

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const username = String(form.get("username") || "").trim();
    const password = String(form.get("password") || "").trim();

    if (username === DEFAULT_USER.username && password === DEFAULT_USER.password) {
      setError("");
      router.push("/trade-system/home");
    } else {
      setError(
        isZh
          ? "\u8d26\u53f7\u6216\u5bc6\u7801\u9519\u8bef\uff0c\u8bf7\u4f7f\u7528 admin / 123456"
          : "Wrong username or password, please use admin / 123456."
      );
    }
  };

  return (
    <div className="page">
      <h1>{isZh ? "\u4ea4\u6613\u7cfb\u7edf\u767b\u5f55" : "Trading system login"}</h1>
      <p className="hero-desc">
        {isZh
          ? "\u8bf7\u8f93\u5165\u9ed8\u8ba4\u8d26\u53f7\u5bc6\u7801\uff1aadmin / 123456"
          : "Please use the default account: admin / 123456"}
      </p>
      <form className="system-form" onSubmit={onSubmit}>
        <label>
          <span>{isZh ? "\u7528\u6237\u540d / \u90ae\u7bb1" : "Username / email"}</span>
          <input name="username" placeholder="admin" />
        </label>
        <label>
          <span>{isZh ? "\u5bc6\u7801" : "Password"}</span>
          <input name="password" type="password" placeholder="123456" />
        </label>
        <button type="submit" className="btn btn-primary system-submit">
          {isZh ? "\u767b\u5f55" : "Login"}
        </button>
        {error && (
          <p className="form-error" style={{ marginTop: 8 }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
