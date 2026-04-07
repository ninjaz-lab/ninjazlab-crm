import { unstable_noStore as noStore } from "next/cache";
import { getEmailLists } from "@/lib/actions/email-marketing";
import { SubscriberManager } from "./subscriber-manager";

export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ list?: string }>;
}) {
  noStore();
  const { list: listId } = await searchParams;
  const lists = await getEmailLists();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscriber Lists</h1>
        <p className="text-muted-foreground">
          Manage your lists and subscribers.
        </p>
      </div>
      <SubscriberManager lists={lists} defaultListId={listId} />
    </div>
  );
}
