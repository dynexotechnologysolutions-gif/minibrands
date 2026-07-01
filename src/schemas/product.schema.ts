import * as z from "zod";

export const ProductImageSchema = z.object({
  url: z.string().url("Invalid image URL"),
  cloudinaryPublicId: z.string().min(1, "Cloudinary public ID is required"),
});

export const ProductVariantSchema = z.object({
  size: z.string().min(1, "Size is required"),
  stockCount: z
    .number({ message: "Stock count must be a number" })
    .int("Stock count must be an integer")
    .nonnegative("Stock count cannot be negative"),
});

export const ProductCreateSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(120, "Name must not exceed 120 characters"),
  shortDescription: z
    .string()
    .min(1, "Short description is required")
    .max(150, "Short description must not exceed 150 characters"),
  fullDescription: z.string().min(10, "Full description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional().nullable(),
  tags: z
    .array(
      z
        .string()
        .min(2, "Tag must be at least 2 characters")
        .max(30, "Tag must not exceed 30 characters")
    )
    .max(10, "A maximum of 10 tags are allowed")
    .default([]),
  price: z
    .number({ message: "Price must be a number" })
    .int("Price must be a whole number in paise")
    .min(10000, "Price must be at least ₹100 (10,000 paise)"),
  images: z
    .array(ProductImageSchema)
    .max(6, "A maximum of 6 images are allowed")
    .default([]),
  variants: z
    .array(ProductVariantSchema)
    .default([]),
  aiGenerated: z.boolean().default(false),
});

export const ProductUpdateSchema = ProductCreateSchema.partial().extend({
  productId: z.string().uuid("Invalid product ID"),
});

export type ProductImageInput = z.infer<typeof ProductImageSchema>;
export type ProductVariantInput = z.infer<typeof ProductVariantSchema>;
export type ProductCreateInput = z.infer<typeof ProductCreateSchema>;
export type ProductUpdateInput = z.infer<typeof ProductUpdateSchema>;
