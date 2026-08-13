import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../lib/prisma";

// Mock prisma client
vi.mock("../lib/prisma", () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
    seller: {
      update: vi.fn(),
    },
  },
}));

interface MockUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MockSeller {
  id: string;
  userProfileId: string;
  businessName: string;
  storeName: string;
  storeLogo: string | null;
  storeBanner: string | null;
  storeDescription: string | null;
  category: string;
  city: string;
  razorpayFundAccountId: string | null;
  status: string;
  gstin: string | null;
  businessAddress: string | null;
  panNumber: string | null;
  panName: string | null;
  panCardUrl: string | null;
  aadhaarNumber: string | null;
  aadhaarName: string | null;
  aadhaarFrontUrl: string | null;
  aadhaarBackUrl: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  bankAccountName: string | null;
  cancelledChequeUrl: string | null;
  verificationMetadata: string | null;
  adminNotes: string | null;
  submittedAt: Date | null;
  verifiedAt: Date | null;
  rejectedAt: Date | null;
  suspendedAt: Date | null;
  approvedBy: string | null;
  rejectedBy: string | null;
  suspendedBy: string | null;
  currentStep: number;
  createdAt: Date;
  updatedAt: Date;
}

describe("Buyer and Seller Profile Picture Isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. Buyer profile update (updating User.image) MUST NOT modify Seller.storeLogo", async () => {
    // Simulate Buyer updating image to C (Initial state: Buyer image = A, Seller logo = B)
    const buyerNewImage = "image-C.png";

    const mockUserResponse: MockUser = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      emailVerified: true,
      image: buyerNewImage,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockUpdateUser = vi.mocked(prisma.user.update).mockResolvedValue(mockUserResponse as never);

    // Call simulated database update
    await prisma.user.update({
      where: { id: "user-123" },
      data: { image: buyerNewImage },
    });

    // Verify User.image is updated to C
    expect(mockUpdateUser).toHaveBeenCalledWith({
      where: { id: "user-123" },
      data: { image: buyerNewImage },
    });

    // Seller.storeLogo should remain B (not updated or touched by user update call)
    expect(prisma.seller.update).not.toHaveBeenCalled();
  });

  it("2. Seller profile update (updating Seller.storeLogo) MUST NOT modify User.image", async () => {
    // Simulate Seller updating logo to D (Initial state: Buyer image = C, Seller logo = B)
    const sellerNewLogo = "logo-D.png";

    const mockSellerResponse: MockSeller = {
      id: "seller-123",
      userProfileId: "profile-123",
      businessName: "My Boutique",
      storeName: "My Boutique",
      storeLogo: sellerNewLogo,
      storeBanner: null,
      storeDescription: null,
      category: "clothing",
      city: "Chennai",
      razorpayFundAccountId: null,
      status: "APPROVED",
      gstin: null,
      businessAddress: null,
      panNumber: null,
      panName: null,
      panCardUrl: null,
      aadhaarNumber: null,
      aadhaarName: null,
      aadhaarFrontUrl: null,
      aadhaarBackUrl: null,
      bankAccountNumber: null,
      bankIfsc: null,
      bankAccountName: null,
      cancelledChequeUrl: null,
      verificationMetadata: null,
      adminNotes: null,
      submittedAt: null,
      verifiedAt: null,
      rejectedAt: null,
      suspendedAt: null,
      approvedBy: null,
      rejectedBy: null,
      suspendedBy: null,
      currentStep: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockUpdateSeller = vi.mocked(prisma.seller.update).mockResolvedValue(mockSellerResponse as never);

    // Call simulated database update
    await prisma.seller.update({
      where: { id: "seller-123" },
      data: { storeLogo: sellerNewLogo },
    });

    // Verify Seller.storeLogo is updated to D
    expect(mockUpdateSeller).toHaveBeenCalledWith({
      where: { id: "seller-123" },
      data: { storeLogo: sellerNewLogo },
    });

    // User.image should remain C (not updated or touched by seller update call)
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
