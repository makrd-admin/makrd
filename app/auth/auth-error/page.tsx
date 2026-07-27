export default function AuthErrorPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-semibold">Sign-in failed</h1>
      <p className="text-neutral-500">Something went wrong completing sign-in. Please try again.</p>
      <a href="/login" className="text-sm font-medium underline">
        Back to sign in
      </a>
    </main>
  );
}
