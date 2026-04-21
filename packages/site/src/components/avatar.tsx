import { User } from "@short-as/types";

const getInitials = (name?: string) =>
  name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export const Avatar = ({ size = "32px", user }: { size?: string; user?: User }) => {
  if (user?.profilePictureUrl) {
    return (
      <div
        className="rounded-full bg-gray-300 bg-cover bg-center"
        style={{ width: size, height: size, minWidth: size, backgroundImage: `url(${user.profilePictureUrl})` }}
      />
    );
  }

  const initials = getInitials(user?.name);

  return (
    <div
      className="rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium"
      style={{ width: size, height: size, minWidth: size, fontSize: `calc(${size} * 0.4)` }}
    >
      {initials}
    </div>
  );
};
