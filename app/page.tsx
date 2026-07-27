import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">makrd</h1>
      {user ? (
        <>
          <p className="text-neutral-500">Signed in as {user.email}</p>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
            >
              Sign out
            </button>
          </form>
        </>
      ) : (
        <a
          href="/login"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Sign in
        </a>
      )}
    </main>
  );
}
