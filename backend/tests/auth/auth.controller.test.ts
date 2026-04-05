import { Request, Response, NextFunction } from "express";
import * as authService from "../../src/services/authService";
import { register, login } from "../../src/controllers/authController";

jest.mock("../../src/services/authService");

const flushPromises = () => new Promise(process.nextTick); 
// flushPromises() waits for all pending async operations to complete so tests don’t run assertions too early.

describe("authController", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { body: {} };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe("register", () => {
    it("returns 201 and json response when register succeeds", async () => {
      const serviceResult = {
        token: "fake-token",
        user: {
          id: 1,
          name: "Arkar",
          umassEmail: "arkar@umass.edu",
          role: "user",
        },
      };

      mockReq.body = {
        name: "Arkar",
        umassEmail: "arkar@umass.edu",
        password: "Test1234!",
      };

      (authService.register as jest.Mock).mockResolvedValue(serviceResult);

      register(mockReq as Request, mockRes as Response, mockNext);

      await flushPromises();

      expect(authService.register).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(serviceResult);
    });

    it("calls next(error) when register fails", async () => {
      const error = new Error("Register failed");

      (authService.register as jest.Mock).mockRejectedValue(error);

      register(mockReq as Request, mockRes as Response, mockNext);

      await flushPromises();

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("login", () => {
    it("returns 200 and json response when login succeeds", async () => {
      const serviceResult = {
        token: "fake-token",
        user: {
          id: 1,
          name: "Arkar",
          umassEmail: "arkar@umass.edu",
          role: "user",
        },
      };

      mockReq.body = {
        umassEmail: "arkar@umass.edu",
        password: "Test1234!",
      };

      (authService.login as jest.Mock).mockResolvedValue(serviceResult);

      login(mockReq as Request, mockRes as Response, mockNext);

      await flushPromises();

      expect(authService.login).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.json).toHaveBeenCalledWith(serviceResult);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("calls next(error) when login fails", async () => {
      const error = new Error("Login failed");

      (authService.login as jest.Mock).mockRejectedValue(error);

      login(mockReq as Request, mockRes as Response, mockNext);

      await flushPromises();

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});