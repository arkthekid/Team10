import backpackImg from "@/assets/listing-backpack.jpg";
import carImg from "@/assets/listing-car.jpg";
import apartmentImg from "@/assets/listing-apartment.jpg";
import tableImg from "@/assets/listing-table.jpg";
import motorcycleImg from "@/assets/listing-motorcycle.jpg";
import cabinetImg from "@/assets/listing-cabinet.jpg";

export interface Listing {
  id: string;
  title: string;
  price: number | null;
  location: string;
  image: string;
  category: string;
  description: string;
  seller: string;
  postedDate: string;
}

export const listings: Listing[] = [
  {
    id: "1",
    title: "1 Bdrm 2 Bath Apartment",
    price: 1475,
    location: "Amherst, MA",
    image: apartmentImg,
    category: "Housing",
    description: "Spacious 1 bedroom, 2 bath apartment near campus. Includes parking and laundry in-unit. Available for spring semester.",
    seller: "Alex M.",
    postedDate: "2 days ago",
  },
  {
    id: "2",
    title: "2019 Kawasaki Ninja",
    price: 3800,
    location: "Hadley, MA",
    image: motorcycleImg,
    category: "Vehicles",
    description: "2019 Kawasaki Ninja 400, well maintained, low miles. Perfect commuter bike.",
    seller: "Jordan K.",
    postedDate: "5 hours ago",
  },
  {
    id: "3",
    title: "2012 Honda Accord",
    price: 12000,
    location: "Amherst, MA",
    image: carImg,
    category: "Vehicles",
    description: "2012 Honda Accord EX, 85k miles, clean title. Runs great.",
    seller: "Sam T.",
    postedDate: "1 day ago",
  },
  {
    id: "4",
    title: "North Face Backpack",
    price: 50,
    location: "UMass Campus",
    image: backpackImg,
    category: "Accessories",
    description: "Lightly used North Face Recon backpack. Great for classes and hiking.",
    seller: "Riley P.",
    postedDate: "3 hours ago",
  },
  {
    id: "5",
    title: "Portable Folding Table",
    price: null,
    location: "Northampton, MA",
    image: tableImg,
    category: "Furniture",
    description: "Free portable folding table. Great condition, just don't need it anymore.",
    seller: "Casey L.",
    postedDate: "1 week ago",
  },
  {
    id: "6",
    title: "Kitchen Cabinet",
    price: 200,
    location: "Amherst, MA",
    image: cabinetImg,
    category: "Furniture",
    description: "White wooden kitchen cabinet in excellent condition. Must pick up.",
    seller: "Morgan D.",
    postedDate: "4 days ago",
  },
];

export const categories = ["All", "Appliances", "Clothes", "Books", "Electronics", "Transportation", "Furnitures", "Dorm Essentials", "Fitness", "Other"];
