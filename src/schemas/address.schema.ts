import * as z from "zod";

export const AddressCreateSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  line1: z.string().min(5, "Address line 1 must be at least 5 characters").max(200),
  line2: z.string().max(200).optional().nullable().transform(v => v || null),
  city: z.enum(["Chennai"], {
    message: "Delivery is currently restricted to Chennai only.",
  }),
  pincode: z.string().length(6, "Pincode must be exactly 6 digits").regex(/^\d+$/, "Pincode must be numeric"),
  isDefault: z.boolean().optional().default(false),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export type AddressCreateInput = z.infer<typeof AddressCreateSchema>;
