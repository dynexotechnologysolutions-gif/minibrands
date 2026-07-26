import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export class RoleService {
  static async getUserProfile(userId: string) {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
        include: {
          user: true,
          seller: {
            include: {
              verification: true,
            },
          },
        },
      });
      if (profile && profile.user.email === "sham1309kumar@gmail.com" && profile.role !== "ADMIN") {
        console.log(`RoleService: Promoting founder email ${profile.user.email} to ADMIN.`);
        const updatedProfile = await prisma.userProfile.update({
          where: { id: profile.id },
          data: { role: "ADMIN" },
          include: {
            user: true,
            seller: {
              include: {
                verification: true,
              },
            },
          },
        });
        return updatedProfile;
      }
      return profile;
    } catch (error) {
      console.error("RoleService.getUserProfile error:", error);
      return null;
    }
  }

  static verifyRole(userRole: Role, requiredRole?: Role): boolean {
    if (!requiredRole) return true;
    
    // Strict admin or super admin check
    if (requiredRole === Role.ADMIN) {
      return userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
    }
    // Strict seller check
    if (requiredRole === Role.SELLER) {
      return userRole === Role.SELLER || userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
    }
    // Buyers can be anyone authenticated (buyers, sellers, admins)
    if (requiredRole === Role.BUYER) {
      return (
        userRole === Role.BUYER ||
        userRole === Role.SELLER ||
        userRole === Role.ADMIN ||
        userRole === Role.SUPER_ADMIN
      );
    }
    return userRole === requiredRole;
  }
}
