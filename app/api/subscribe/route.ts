import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function POST(request: Request) {
  try {
    const { email, message } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "邮箱为必填项。" }, { status: 400 });
    }

    await sql`
      CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await sql`
      INSERT INTO subscribers (email, message)
      VALUES (${email}, ${message || null})
      ON CONFLICT (email) DO UPDATE SET
        message = EXCLUDED.message,
        created_at = NOW();
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "服务暂时不可用，请稍后重试。" }, { status: 500 });
  }
}

