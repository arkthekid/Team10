import bcrypt from "bcrypt";
import * as authService from "../../src/services/authService";
import { AppDataSource } from "../../src/config/data-source";
import { AppError } from "../../src/utils/AppError";

jest.mock("../../src/config/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe("authService", () => {
  const mockRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_EXPIRES_IN = "1h";
    process.env.NODE_ENV = "test";
  });

  describe("register", () => {
    it("registers a user successfully", async () => {
      mockRepo.findOne.mockResolvedValue(null);

      mockRepo.create.mockImplementation((data) => ({
        id: 1,
        role: "user",
        ...data,
      }));

      mockRepo.save.mockResolvedValue(undefined);

      const result = await authService.register({
        name: "Arkar",
        umassEmail: "arkar@umass.edu",
        password: "Test1234!",
      });

      expect(result.token).toBeTruthy();
      expect(result.user.name).toBe("Arkar");
      expect(result.user.umassEmail).toBe("arkar@umass.edu");
      expect(result.user.role).toBe("user");

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { umassEmail: "arkar@umass.edu" },
      });

      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it("rejects missing fields", async () => {
      await expect(
        authService.register({
          name: "",
          umassEmail: "",
          password: "",
        })
      ).rejects.toThrow(AppError);
    });

    it("rejects non-umass email", async () => {
      await expect(
        authService.register({
          name: "Arkar",
          umassEmail: "arkar@gmail.com",
          password: "Test1234!",
        })
      ).rejects.toThrow("Must use a @umass.edu email");
    });

    it("rejects duplicate email", async () => {
      mockRepo.findOne.mockResolvedValue({
        id: 1,
        umassEmail: "arkar@umass.edu",
      });

      await expect(
        authService.register({
          name: "Arkar",
          umassEmail: "arkar@umass.edu",
          password: "Test1234!",
        })
      ).rejects.toThrow("Email already registered");
    });
  });

  describe("login", () => {
    it("logs in with valid credentials", async () => {
      const passwordHash = await bcrypt.hash("Test1234!", 4);

      mockRepo.findOne.mockResolvedValue({
        id: 1,
        name: "Arkar",
        umassEmail: "arkar@umass.edu",
        passwordHash,
        role: "user",
      });

      const result = await authService.login({
        umassEmail: "arkar@umass.edu",
        password: "Test1234!",
      });

      expect(result.token).toBeTruthy();
      expect(result.user.name).toBe("Arkar");
      expect(result.user.umassEmail).toBe("arkar@umass.edu");
    });

    it("rejects unknown email", async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        authService.login({
          umassEmail: "nouser@umass.edu",
          password: "Test1234!",
        })
      ).rejects.toThrow("Invalid credentials");
    });

    it("rejects wrong password", async () => {
      const passwordHash = await bcrypt.hash("Correct123!", 4);

      mockRepo.findOne.mockResolvedValue({
        id: 1,
        name: "Arkar",
        umassEmail: "arkar@umass.edu",
        passwordHash,
        role: "user",
      });

      await expect(
        authService.login({
          umassEmail: "arkar@umass.edu",
          password: "WrongPassword!",
        })
      ).rejects.toThrow("Invalid credentials");
    });
  });
});