import { MenuScreen } from "@/components/MenuScreen";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; table: string }>;
}) {
  const { slug, table } = await params;
  return <MenuScreen slug={slug} table={table} />;
}
