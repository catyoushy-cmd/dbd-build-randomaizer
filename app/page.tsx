import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold text-center">
        DBD Build Randomizer
      </h1>
      <p className="text-muted-foreground text-center max-w-md">
        Рандомайзер билдов для Dead by Daylight — 4 перка, предмет/аддоны, моли.
      </p>
      <Link
        href="/roll"
        className="rounded-lg bg-primary text-primary-foreground px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
      >
        К рандомайзеру
      </Link>
    </main>
  );
}
