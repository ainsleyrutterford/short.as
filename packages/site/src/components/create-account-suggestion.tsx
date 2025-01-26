import Link from "next/link";

export const CreateAccountSuggestion = () => (
  <div className="mt-8 flex w-full items-center justify-center flex-row">
    <p className="text-sm text-muted-foreground text-center">
      Want to manage, update, or track analytics for your URLs?{"  "}
      <Link className="text-primary underline-offset-4 hover:underline" href="/login">
        Create a free account!
      </Link>
    </p>
  </div>
);
