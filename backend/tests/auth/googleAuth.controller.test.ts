import { Request, Response, NextFunction } from "express";
import { googleAuth } from "../../src/controllers/authController";
import * as googleAuthService from "../../src/services/googleAuthService";
import { AppError } from "../../src/utils/AppError";

jest.mock("../../src/services/googleAuthService");

const mockGoogleLogin = googleAuthService.googleLogin as jest.Mock;

const mockReq = (body = {}) => ({ body }) as Request;

const mockRes = () => {
  const res = {} as Response;
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as jest.MockedFunction<NextFunction>;

describe("googleAuth controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("googleAuth", () => {
    // Success case
    it("returns token and user for valid idToken", async () => {
      const fakeResult = {
        token: "fake-jwt",
        user: {
          id: "some-uuid",
          name: "Arkar",
          umassEmail: "arkar@umass.edu",
          role: "user",
        },
      };

      mockGoogleLogin.mockResolvedValue(fakeResult);

      const req = mockReq({ idToken: "fake-google-token" });
      const res = mockRes();

      await googleAuth(req, res, mockNext);

      expect(mockGoogleLogin).toHaveBeenCalledWith("fake-google-token");
      expect(res.json).toHaveBeenCalledWith(fakeResult);
    });

    // Error case - missing idToken
    it("calls next with 400 AppError when idToken is missing", async () => {
      const req = mockReq({});
      const res = mockRes();

      await googleAuth(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const calledWith = mockNext.mock.calls[0]?.[0] as unknown as AppError;
      expect(calledWith).toBeInstanceOf(AppError);
      expect(calledWith.message).toBe("Google ID token is required");
    });

    // Edge case - service throws
    it("calls next with error when googleAuthService throws", async () => {
      const error = new AppError("Must use a @umass.edu Google account", 403);
      mockGoogleLogin.mockRejectedValue(error);

      const req = mockReq({ idToken: "fake-google-token" });
      const res = mockRes();

      // asyncHandler doesn't await internally, so we need to flush the promise
      googleAuth(req, res, mockNext);
      await Promise.resolve();
      await Promise.resolve(); // flush twice to ensure catch(next) runs

      expect(mockNext).toHaveBeenCalled();
      const calledWith = mockNext.mock.calls[0]?.[0] as unknown as AppError;
      expect(calledWith).toBeDefined();
      expect(calledWith.message).toBe("Must use a @umass.edu Google account");
    });
  });
});
