import * as googleAuthService from "../../src/services/googleAuthService";
import { AppDataSource } from "../../src/config/data-source";
import { AppError } from "../../src/utils/AppError";

jest.mock("../../src/config/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

const mockVerifyIdToken = jest.fn();

jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: (...args: unknown[]) => mockVerifyIdToken(...args),
  })),
}));

jest.mock("../../src/services/authService", () => ({
  signToken: jest.fn().mockReturnValue("fake-jwt-token"),
}));

describe("googleAuthService", () => {
  const mockRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);
    process.env.GOOGLE_CLIENT_ID = "fake-client-id";
    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_EXPIRES_IN = "1h";
  });

  describe("googleLogin", () => {
    // Success case - new user
    it("creates a new user and returns token for valid UMass account", async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: "arkar@umass.edu",
          name: "Arkar",
        }),
      });

      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockImplementation((data) => ({
        id: "some-uuid",
        role: "user",
        ...data,
      }));
      mockRepo.save.mockResolvedValue(undefined);

      const result = await googleAuthService.googleLogin("fake-google-token");

      expect(result.token).toBeTruthy();
      expect(result.user.umassEmail).toBe("arkar@umass.edu");
      expect(result.user.name).toBe("Arkar");
      expect(result.user.role).toBe("user");
      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalled();
    });

    // Success case - existing user
    it("returns token for already registered UMass user without creating a new one", async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: "arkar@umass.edu",
          name: "Arkar",
        }),
      });

      mockRepo.findOne.mockResolvedValue({
        id: "existing-uuid",
        name: "Arkar",
        umassEmail: "arkar@umass.edu",
        role: "user",
      });

      const result = await googleAuthService.googleLogin("fake-google-token");

      expect(result.token).toBeTruthy();
      expect(result.user.umassEmail).toBe("arkar@umass.edu");
      expect(mockRepo.create).not.toHaveBeenCalled();
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    // Error case - non umass email
    it("throws 403 for non-umass email", async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: "arkar@gmail.com",
          name: "Arkar",
        }),
      });

      await expect(
        googleAuthService.googleLogin("fake-google-token"),
      ).rejects.toThrow("Must use a @umass.edu Google account");
    });

    // Error case - null payload
    it("throws 401 when Google payload is null", async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => null,
      });

      await expect(
        googleAuthService.googleLogin("fake-google-token"),
      ).rejects.toThrow("Invalid Google token");
    });

    // Edge case - missing GOOGLE_CLIENT_ID
    it("throws 500 when GOOGLE_CLIENT_ID is not set", async () => {
      delete process.env.GOOGLE_CLIENT_ID;

      await expect(
        googleAuthService.googleLogin("fake-google-token"),
      ).rejects.toThrow("Google Client ID not configured");
    });

    // Edge case - missing email or name in payload
    it("throws 400 when Google payload is missing email or name", async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: null,
          name: null,
        }),
      });

      await expect(
        googleAuthService.googleLogin("fake-google-token"),
      ).rejects.toThrow("Google account missing email or name");
    });

    // Edge case - Google token verification fails
    it("throws when Google token verification fails", async () => {
      mockVerifyIdToken.mockRejectedValue(new Error("Token expired"));

      await expect(googleAuthService.googleLogin("bad-token")).rejects.toThrow(
        "Token expired",
      );
    });

    // Edge case - only name missing
    it("throws 400 when Google payload has email but no name", async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: "arkar@umass.edu",
          name: null,
        }),
      });

      await expect(
        googleAuthService.googleLogin("fake-google-token"),
      ).rejects.toThrow("Google account missing email or name");
    });

    // Edge case - cs.umass.edu domain rejected
    it("throws 403 for cs.umass.edu email", async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: "arkar@cs.umass.edu",
          name: "Arkar",
        }),
      });

      await expect(
        googleAuthService.googleLogin("fake-google-token"),
      ).rejects.toThrow("Must use a @umass.edu Google account");
    });

    // Edge case - save fails for new user
    it("throws if saving new user fails", async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: "arkar@umass.edu",
          name: "Arkar",
        }),
      });

      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockImplementation((data) => ({
        id: "some-uuid",
        role: "user",
        ...data,
      }));
      mockRepo.save.mockRejectedValue(new Error("Save failed"));

      await expect(
        googleAuthService.googleLogin("fake-google-token"),
      ).rejects.toThrow("Save failed");
    });
  });
});
