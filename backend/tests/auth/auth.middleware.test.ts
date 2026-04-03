import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { protect } from "../../src/middleware/auth";
import { AppDataSource } from "../../src/config/data-source";

jest.mock("../../src/config/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe("protect middleware", () => {
  const mockRepo = {
    findOne: jest.fn(),
  };

  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

    mockReq = {
      headers: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();

    process.env.JWT_SECRET = "test-secret";
  });

  it("returns 401 when authorization header is missing", async () => {
    await protect(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Missing token" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("returns 401 when authorization header is not a Bearer token", async () => {
    mockReq.headers = {
      authorization: "Basic abc123",
    };

    await protect(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Missing token" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("returns 401 when token is invalid", async () => {
    mockReq.headers = {
      authorization: "Bearer invalid-token",
    };

    await protect(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid token" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("returns 401 when token is valid but user is not found", async () => {
    const token = jwt.sign(
      { id: "123", email: "arkar@umass.edu", role: "user" },
      process.env.JWT_SECRET as string
    );

    mockReq.headers = {
      authorization: `Bearer ${token}`,
    };

    mockRepo.findOne.mockResolvedValue(null);

    await protect(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRepo.findOne).toHaveBeenCalledWith({
      where: { id: "123" },
    });
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid token" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("attaches req.user and calls next when token is valid", async () => {
    const token = jwt.sign(
      { id: "123", email: "arkar@umass.edu", role: "user" },
      process.env.JWT_SECRET as string
    );

    mockReq.headers = {
      authorization: `Bearer ${token}`,
    };

    mockRepo.findOne.mockResolvedValue({
      id: "123",
      umassEmail: "arkar@umass.edu",
      role: "user",
    });

    await protect(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRepo.findOne).toHaveBeenCalledWith({
      where: { id: "123" },
    });

    expect(mockReq.user).toEqual({
      id: "123",
      email: "arkar@umass.edu",
      role: "user",
    });

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });
});