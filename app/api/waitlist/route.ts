import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("waitlist")
    .insert({ email: email.toLowerCase().trim() });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "duplicate" }, { status: 409 });
    }
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
