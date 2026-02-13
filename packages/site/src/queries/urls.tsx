import { shortAsClient } from "@/lib/client";
import { Url, ViewAggregateItem } from "@short-as/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const URL_KEY = "URL";

export const useGetUrl = (shortUrlId: string) =>
  useQuery({
    queryKey: [URL_KEY, shortUrlId],
    queryFn: async () => {
      const response = await shortAsClient.fetch(`/users/urls/${shortUrlId}`);
      if (!response.ok) throw new Error("Failed to fetch URL");
      return (await response.json()) as Url;
    },
  });

export const useGetUrls = () =>
  useQuery({
    queryKey: [URL_KEY],
    queryFn: async () => {
      const response = await shortAsClient.fetch("/users/urls");
      if (!response.ok) throw new Error("Failed to fetch URLs");
      const urls = (await response.json()) as Url[];
      return urls.sort((a, b) => (a.createdTimestamp < b.createdTimestamp ? 1 : -1));
    },
  });

export const useGetUrlViews = (shortUrlId: string, from?: string, to?: string, period?: string) =>
  useQuery({
    queryKey: [URL_KEY, shortUrlId, from, to, period],
    queryFn: async () => {
      const queryStrings = `?startDate=${from}&endDate=${to}&interval=${period}`;
      const response = await shortAsClient.fetch(`/users/urls/${shortUrlId}/views${queryStrings}`);
      if (!response.ok) throw new Error("Failed to fetch URL views");
      const views = (await response.json()) as ViewAggregateItem[];
      return views.sort((a, b) => (a.sk > b.sk ? 1 : -1));
    },
  });

export const useAddUrl = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ longUrl, loggedIn }: { longUrl: string; loggedIn?: boolean }) => {
      const response = await shortAsClient.fetch(`${loggedIn ? "/users/urls" : "/urls"}`, {
        method: "POST",
        body: JSON.stringify({ longUrl }),
      });
      if (!response.ok) throw new Error("Failed to create URL");
      return (await response.json()) as Url;
    },
    // Direct updates, we don't refetch the list of URLs, we just update our local
    // cache with the single URL returned by the server. See:
    // https://tkdodo.eu/blog/mastering-mutations-in-react-query#direct-updates
    onSuccess: (newUrl) => {
      queryClient.setQueryData([URL_KEY], (old: Url[] | undefined) => [newUrl, ...(old ?? [])]);
      queryClient.setQueryData([URL_KEY, newUrl.shortUrlId], newUrl);
    },
  });
};

export const useUpdateUrl = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shortUrlId, longUrl }: { shortUrlId: string; longUrl: string }) => {
      const response = await shortAsClient.fetch(`/users/urls/${shortUrlId}`, {
        method: "PATCH",
        body: JSON.stringify({ longUrl }),
      });
      if (!response.ok) throw new Error("Failed to update URL");
      return (await response.json()) as Url;
    },
    onSuccess: (updatedUrl) => {
      queryClient.setQueryData([URL_KEY], (old: Url[] | undefined) =>
        (old ?? []).map((url) => (url.shortUrlId === updatedUrl.shortUrlId ? updatedUrl : url)),
      );
      queryClient.setQueryData([URL_KEY, updatedUrl.shortUrlId], updatedUrl);
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
      queryClient.removeQueries({ queryKey: [URL_KEY, deletedUrlId] });
    },
  });
};
