import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmailService } from "@/lib/email.service";
import { MockEmailProvider } from "@/providers/email/mock.provider";
import { validateEmailConfig } from "@/providers/email/config";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailAuditLog: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("SMTP/Email Infrastructure Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Configuration Validator", () => {
    it("should not throw error if USE_SMTP_TRANSPORT is false", () => {
      process.env.USE_SMTP_TRANSPORT = "false";
      expect(() => validateEmailConfig()).not.toThrow();
    });

    it("should throw error if USE_SMTP_TRANSPORT is true but config is missing", () => {
      process.env.USE_SMTP_TRANSPORT = "true";
      delete process.env.SMTP_HOST;
      expect(() => validateEmailConfig()).toThrow();
    });
  });

  describe("MockEmailProvider Sandbox", () => {
    it("should successfully sandbox sent emails in console", async () => {
      const provider = new MockEmailProvider();
      const res = await provider.send({
        to: "test@domain.com",
        subject: "Test Subject",
        html: "<p>Test</p>",
        category: "AUTH",
      });
      expect(res.messageId).toContain("mock-msg-");
    });
  });

  describe("EmailService Coordination & Auditing", () => {
    it("should create audit log entries and resolve successfully", async () => {
      process.env.USE_SMTP_TRANSPORT = "false";

      const mockLog = { id: "log-123", status: "PENDING" };
      vi.mocked(prisma.emailAuditLog.create).mockResolvedValue(mockLog as any);
      vi.mocked(prisma.emailAuditLog.update).mockResolvedValue({ ...mockLog, status: "SENT" } as any);

      const success = await EmailService.send({
        to: "recipient@domain.com",
        subject: "Hello!",
        html: "<h1>Welcome</h1>",
        category: "TRANSACTIONAL",
      });

      expect(success).toBe(true);
      expect(prisma.emailAuditLog.create).toHaveBeenCalledWith({
        data: {
          recipient: "recipient@domain.com",
          subject: "Hello!",
          category: "TRANSACTIONAL",
          status: "PENDING",
          attempts: 1,
        },
      });
      expect(prisma.emailAuditLog.update).toHaveBeenCalledWith({
        where: { id: "log-123" },
        data: {
          status: "SENT",
          errorLog: expect.stringContaining("MessageId: mock-msg-"),
        },
      });
    });
  });
});
