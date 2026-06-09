import { OrderScreen } from "@/components/OrderScreen";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; table: string }>;
}) {
  const { slug, table } = await params;
  return <OrderScreen slug={slug} table={table} />;
}
