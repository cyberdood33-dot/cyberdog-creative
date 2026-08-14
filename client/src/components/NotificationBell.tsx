import { Bell } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export function NotificationBell(){
  const { data=[] }=trpc.notifications.inbox.useQuery(undefined,{staleTime:15_000});
  const unread=data.filter(notification=>!notification.readAt).length;
  return <Link href="/notifications" aria-label={unread?`${unread} unread notifications`:"Notifications"} className="relative grid size-9 place-items-center rounded-lg text-zinc-500 hover:bg-white hover:text-zinc-900"><Bell className="size-4"/>{unread>0&&<span className="absolute -right-0.5 -top-0.5 grid min-w-4 size-4 place-items-center rounded-full bg-[#c92020] px-1 text-[9px] font-extrabold text-white">{unread>9?"9+":unread}</span>}</Link>;
}
