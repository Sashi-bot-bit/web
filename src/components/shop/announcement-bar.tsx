import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { isExternalLink } from "@/shared/banners";
import { getHomeContent } from "@/server/catalog";

/** Site-wide message set in admin → Homepage. */
export async function AnnouncementBar() {
  const { announcement, announcementLink } = await getHomeContent();
  if (!announcement) return null;
  const body = (
    <span className="inline-flex items-center gap-1.5">
      {announcement}
      {announcementLink ? <ArrowRight aria-hidden className="size-4" /> : null}
    </span>
  );
  return (
    <div className="bg-accent text-on-accent">
      <p className="mx-auto max-w-6xl px-4 py-2 text-center text-small font-bold">
        {announcementLink ? (
          isExternalLink(announcementLink) ? (
            <a href={announcementLink} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
              {body}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <Link href={announcementLink} className="underline-offset-4 hover:underline">
              {body}
            </Link>
          )
        ) : (
          body
        )}
      </p>
    </div>
  );
}
