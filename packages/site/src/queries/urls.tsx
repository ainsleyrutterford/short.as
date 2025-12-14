import { shortAsClient } from "@/lib/client";
import { Url } from "@short-as/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const URL_KEY = "URL";

export const useGetUrls = () =>
  useQuery({
    queryKey: [URL_KEY],
    queryFn: async () => {
      const data = await shortAsClient.fetch("/users/urls");
      if (!data.ok) throw new Error("Failed to fetch URLs");
      const urls = (await data.json()) as Url[];
      return urls.sort((a, b) => (a.createdTimestamp < b.createdTimestamp ? 1 : -1));
    },
  });

export const useAddUrl = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ longUrl, loggedIn }: { longUrl: string; loggedIn?: boolean }) => {
      const data = await shortAsClient.fetch(`${loggedIn ? "/users/urls" : "/urls"}`, {
        method: "POST",
        body: JSON.stringify({ longUrl }),
      });
      if (!data.ok) throw new Error("Failed to create URL");
      const url = await data.json();
      return url as Url;
    },
    onSuccess: (newUrl) => {
      // Direct updates, we don't refetch the list of URLs, we just update our local
      // cache with the single URL returned by the server. See:
      // https://tkdodo.eu/blog/mastering-mutations-in-react-query#direct-updates
      queryClient.setQueryData([URL_KEY], (old: Url[] | undefined) => [newUrl, ...(old ?? [])]);
    },
  });
};

export const useDeleteUrl = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shortUrlId }: { shortUrlId: string }) => {
      const response = await shortAsClient.fetch(`/users/urls/${shortUrlId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete URL");
      return shortUrlId;
    },
    onSuccess: (deletedUrlId) => {
      queryClient.setQueryData([URL_KEY], (old: Url[] | undefined) =>
        (old ?? []).filter((url) => url.shortUrlId !== deletedUrlId),
      );
    },
  });
};
