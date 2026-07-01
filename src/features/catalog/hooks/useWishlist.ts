import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWishlist, addToWishlist, removeFromWishlist } from "../services/wishlistApi";
import { Product } from "../types/Product";

export function useWishlist() {
  const queryClient = useQueryClient();

  const { data: wishlist = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ["wishlist"],
    queryFn: fetchWishlist,
    retry: false,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ productId, isWishlisted }: { productId: string; isWishlisted: boolean }) => {
      if (isWishlisted) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
    },
    onMutate: async ({ productId, isWishlisted }) => {
      // Cancel outgoing queries to avoid overwrite
      await queryClient.cancelQueries({ queryKey: ["products"] });
      await queryClient.cancelQueries({ queryKey: ["wishlist"] });

      // Snapshot the previous state
      const previousProductsQueries = queryClient.getQueriesData({ queryKey: ["products"] });
      const previousWishlist = queryClient.getQueryData<Product[]>(["wishlist"]);

      // 1. Optimistically update all ["products"] list queries
      queryClient.setQueriesData<any>({ queryKey: ["products"] }, (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          products: oldData.products.map((p: any) =>
            p.id === productId ? { ...p, isWishlisted: !isWishlisted } : p
          ),
        };
      });

      // 2. Optimistically update the ["wishlist"] query cache
      if (isWishlisted) {
        queryClient.setQueryData<Product[]>(["wishlist"], (old) =>
          old ? old.filter((p) => p.id !== productId) : []
        );
      } else {
        // Find the product in existing products caches to populate in wishlist preview
        let foundProduct: any = null;
        for (const [, data] of previousProductsQueries) {
          const matched = (data as any)?.products?.find((p: any) => p.id === productId);
          if (matched) {
            foundProduct = matched;
            break;
          }
        }

        if (foundProduct) {
          queryClient.setQueryData<Product[]>(["wishlist"], (old) => {
            const list = old ? [...old] : [];
            if (!list.some((p) => p.id === productId)) {
              list.push({ ...foundProduct, isWishlisted: true });
            }
            return list;
          });
        }
      }

      return { previousProductsQueries, previousWishlist };
    },
    onError: (err, variables, context) => {
      // Rollback to previous state on failure
      if (context?.previousProductsQueries) {
        for (const [key, value] of context.previousProductsQueries) {
          queryClient.setQueryData(key, value);
        }
      }
      if (context?.previousWishlist) {
        queryClient.setQueryData(["wishlist"], context.previousWishlist);
      }
    },
    onSettled: () => {
      // Re-fetch to ensure sync with server
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  return {
    wishlist,
    isLoading,
    error,
    toggleWishlist: (productId: string, isWishlisted: boolean) =>
      toggleMutation.mutateAsync({ productId, isWishlisted }),
    isToggling: toggleMutation.isPending,
  };
}
