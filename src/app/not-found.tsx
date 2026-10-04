import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 pt-16">
      <p className="text-label font-bold uppercase text-muted">404</p>
      <h1 className="mt-1 text-h1 font-bold">We can’t find that page</h1>
      <p className="mt-2 text-muted">The link may be wrong, or the page may have moved.</p>
      <Link href="/" className="mt-6 inline-flex min-h-11 items-center font-bold underline underline-offset-4">
        Go to the home page
      </Link>
    </div>
  );
}
