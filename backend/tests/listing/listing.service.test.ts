import * as listingService from "../../src/services/listingService";
import { AppDataSource } from "../../src/config/data-source";
import { Listing } from "../../src/entities/Listing";

// ✅ Mock DataSource (NOT entity)
jest.mock("../../src/config/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(), // mock getRepository so we control repo behavior
  },
}));

describe("createListing service", () => {
  afterEach(() => {
    jest.clearAllMocks(); // reset mocks between tests
  });

  it("should sucessfully create and return a listing", async () => {
    const mockInput: Partial<Listing> = { name: "Table" };

    const mockCreatedListing: any = {
      name: "Table",
    };

    const mockSavedListing = {
      id: "1",
      name: "Table",
      sellerId: "user123",
    };

    const mockRepo = {
      create: jest.fn().mockReturnValue(mockCreatedListing), // simulate create()
      save: jest.fn().mockResolvedValue(mockSavedListing),   // simulate save()
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

    const result = await listingService.createListing(mockInput, "user123");

    expect(AppDataSource.getRepository).toHaveBeenCalledWith(Listing); // repo requested
    expect(mockRepo.create).toHaveBeenCalledWith(mockInput);           // create called
    expect(mockCreatedListing.sellerId).toBe("user123");               // seller attached
    expect(mockRepo.save).toHaveBeenCalledWith(mockCreatedListing);    // save called
    expect(result).toEqual(mockSavedListing);                          // correct return
  });

  it("should throw error if repository is not found", async () => {
    (AppDataSource.getRepository as jest.Mock).mockImplementation(() => {
      throw new Error("Repo not found");
    });

    await expect(
      listingService.createListing({ name: "Test" }, "user123")
    ).rejects.toThrow("Repo not found"); 
    // ✅ FIX: call service FIRST → triggers getRepository()

    expect(AppDataSource.getRepository).toHaveBeenCalledWith(Listing); 
    // ✅ FIX: moved AFTER service call so Jest sees the call
  });

  it("should throw error if create fails", async () => {
    const mockRepo = {
      create: jest.fn(() => {
        throw new Error("Create failed"); // simulate failure in create()
      }),
      save: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

    await expect(
      listingService.createListing({ name: "Test" }, "user123")
    ).rejects.toThrow("Create failed"); 
    // ✅ FIX: call service FIRST so create() is actually triggered

    expect(AppDataSource.getRepository).toHaveBeenCalledWith(Listing); 
    // ✅ FIX: moved AFTER service call

    expect(mockRepo.save).not.toHaveBeenCalled(); 
    // ensures save() is NOT called if create() fails
  });

  it("should throw error if save fails", async () => {
    const mockRepo = {
      create: jest.fn().mockReturnValue({ name: "Test" }),
      save: jest.fn().mockRejectedValue(new Error("Save failed")), // simulate save failure
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

    await expect(
      listingService.createListing({ name: "Test" }, "user123")
    ).rejects.toThrow("Save failed");
  });

  it("should save two listings sequentially", async () => {
    const mockRepo = {
      create: jest.fn()
        .mockReturnValueOnce({ name: "Textbook 320" })
        .mockReturnValueOnce({ name: "Wooden chair" }),

      save: jest.fn()
        .mockResolvedValueOnce({
          id: "1",
          name: "Textbook 320",
          sellerId: "user123",
        })
        .mockResolvedValueOnce({
          id: "2",
          name: "Wooden chair",
          sellerId: "user234",
        }),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

    const result1 = await listingService.createListing(
      { name: "Textbook 320" },
      "user123"
    );

    expect(mockRepo.create).toHaveBeenNthCalledWith(1, {
      name: "Textbook 320",
    });

    const result2 = await listingService.createListing(
      { name: "Wooden chair" },
      "user234"
    );

    expect(mockRepo.create).toHaveBeenNthCalledWith(2, {
      name: "Wooden chair",
    });

    expect(mockRepo.create).toHaveBeenCalledTimes(2);
    expect(mockRepo.save).toHaveBeenCalledTimes(2);

    expect(result1).toEqual({
      id: "1",
      name: "Textbook 320",
      sellerId: "user123",
    });

    expect(result2).toEqual({
      id: "2",
      name: "Wooden chair",
      sellerId: "user234",
    });
  });
});

describe("getListings controller", () => {

})