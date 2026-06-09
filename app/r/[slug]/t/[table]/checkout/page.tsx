import { CheckoutScreen } from "@/components/CheckoutScreen";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; table: string }>;
}) {
  const { slug, table } = await params;
  return <CheckoutScreen slug={slug} table={table} />;
}
