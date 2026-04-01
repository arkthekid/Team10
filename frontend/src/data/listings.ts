import backpackImg from "@/assets/listing-backpack.jpg";
import carImg from "@/assets/listing-car.jpg";
import apartmentImg from "@/assets/listing-apartment.jpg";
import tableImg from "@/assets/listing-table.jpg";
import motorcycleImg from "@/assets/listing-motorcycle.jpg";
import cabinetImg from "@/assets/listing-cabinet.jpg";

export interface Category {
  name: string;
}

export interface Seller {
  name: string;
}

export interface Listing {
  productId: string;
  title: string;
  price: number | null;
  pickUpLocation: string;
  image: string;
  categoryId: Category;
  description: string;
  sellerId: Seller;
  postedDate: string;
}

export const listings: Listing[] = [
  {
    productId: "1",
    title: "1 Bdrm 2 Bath Apartment",
    price: 1475,
    pickUpLocation: "Amherst, MA",
    image: apartmentImg,
    categoryId: { name: "Housing" },
    description: "Spacious 1 bedroom, 2 bath apartment near campus. Includes parking and laundry in-unit. Available for spring semester.",
    sellerId: { name: "Alex M." },
    postedDate: "2 days ago",
  },
  {
    productId: "2",
    title: "2019 Kawasaki Ninja",
    price: 3800,
    pickUpLocation: "Hadley, MA",
    image: motorcycleImg,
    categoryId: { name: "Vehicles" },
    description: "2019 Kawasaki Ninja 400, well maintained, low miles. Perfect commuter bike.",
    sellerId: { name: "Jordan K." },
    postedDate: "5 hours ago",
  },
  {
    productId: "3",
    title: "2012 Honda Accord",
    price: 12000,
    pickUpLocation: "Amherst, MA",
    image: carImg,
    categoryId: { name: "Vehicles" },
    description: "2012 Honda Accord EX, 85k miles, clean title. Runs great.",
    sellerId: { name: "Sam T." },
    postedDate: "1 day ago",
  },
  {
    productId: "4",
    title: "North Face Backpack",
    price: 50,
    pickUpLocation: "UMass Campus",
    image: backpackImg,
    categoryId: { name: "Accessories" },
    description: "Lightly used North Face Recon backpack. Great for classes and hiking.",
    sellerId: { name: "Riley P." },
    postedDate: "3 hours ago",
  },
  {
    productId: "5",
    title: "Portable Folding Table",
    price: null,
    pickUpLocation: "Northampton, MA",
    image: tableImg,
    categoryId: { name: "Furniture" },
    description: "Free portable folding table. Great condition, just don't need it anymore.",
    sellerId: { name: "Casey L." },
    postedDate: "1 week ago",
  },
  {
    productId: "6",
    title: "Kitchen Cabinet",
    price: 200,
    pickUpLocation: "Amherst, MA",
    image: cabinetImg,
    categoryId: { name: "Furniture" },
    description: "White wooden kitchen cabinet in excellent condition. Must pick up.",
    sellerId: { name: "Morgan D." },
    postedDate: "4 days ago",
  },
];

export const categories = ["All", "Appliances", "Clothes", "Books", "Electronics", "Transportation", "Furnitures", "Dorm Essentials", "Fitness", "Other"];
