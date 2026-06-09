import { redirect } from "next/navigation";
import { SHOP_SLUG } from "@/lib/supabase";

export default async function Page({
  params,
}: {
  params: Promise<{ table: string }>;
}) {
  const { table } = await params;
  redirect(`/r/${SHOP_SLUG}/t/${table}/checkout`);
}
