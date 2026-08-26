/**
 * Backfill: Synchronize already-approved KYC sellers stuck in PENDING_VERIFICATION.
 * Scope: SellerVerification.kycStatus IN ('approved','auto_approved') AND Seller.status = 'PENDING_VERIFICATION'
 * Fixes: Seller.status -> APPROVED, SellerVerification.bankVerified -> true, trustScore -> 95
 * Dry-run by default. Use --apply to execute.
 * Run from worktree: npx tsx scripts/backfill-approve-kyc.ts [--apply]
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  const apply = process.argv.includes("--apply");
  console.log(`Mode: ${apply ? "APPLY" : "DRY-RUN"} (use --apply to write)`);

  const stuck = await prisma.seller.findMany({
    where: {
      status: "PENDING_VERIFICATION",
      verification: { kycStatus: { in: ["approved", "auto_approved"] } },
    },
    include: { verification: true },
  });

  console.log(`Found ${stuck.length} stuck seller(s)`);

  for (const s of stuck) {
    const v = s.verification;
    const needsBank = v && !v.bankVerified;
    const needsScore = v && v.trustScore !== 95;
    const needsStatus = s.status !== "APPROVED";
    console.log(
      `- ${s.id} (${s.businessName}) status=${s.status} kyc=${v?.kycStatus} bankVerified=${v?.bankVerified} trustScore=${v?.trustScore} -> needsStatus=${needsStatus} needsBank=${needsBank} needsScore=${needsScore}`
    );

    if (!apply) continue;

    await prisma.$transaction(async (tx) => {
      await tx.seller.update({ where: { id: s.id }, data: { status: "APPROVED", verifiedAt: new Date() } });
      if (v) {
        await tx.sellerVerification.update({
          where: { sellerId: s.id },
          data: { bankVerified: true, trustScore: 95, rejectionReason: null, verifiedAt: v.verifiedAt ?? new Date() },
        });
      }
    });
    console.log(`  -> fixed ${s.id}`);
  }

  if (!apply && stuck.length > 0) {
    console.log("\nDry-run complete. Re-run with --apply to fix.");
  } else if (apply) {
    console.log("\nBackfill complete.");
  } else {
    console.log("\nNo stuck sellers found.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
