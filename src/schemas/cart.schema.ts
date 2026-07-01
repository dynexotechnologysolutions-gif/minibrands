import * as z from "zod";

export const CartReserveSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  variantId: z.string().uuid("Invalid variant ID"),
  quantity: z.number().int().min(1, "Minimum quantity is 1").max(5, "Maximum 5 units can be reserved at a time."),
});

export type CartReserveInput = z.infer<typeof CartReserveSchema>;
