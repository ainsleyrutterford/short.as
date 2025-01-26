export const Avatar = ({ size = "32px", imageUrl }: { size?: string; imageUrl?: string }) => {
  const backgroundImageStyle = imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined;

  return (
    <div
      className={"rounded-full bg-gray-300 bg-cover bg-center"}
      style={{ width: size, height: size, ...backgroundImageStyle }}
    />
  );
};
