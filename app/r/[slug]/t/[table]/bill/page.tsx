import { BillScreen } from "@/components/BillScreen";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; table: string }>;
}) {
  const { slug, table } = await params;
  return <BillScreen slug={slug} table={table} />;
}
