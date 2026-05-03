import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Browse from "./pages/Browse";
import ListingDetail from "./pages/ListingDetail";
import CreateListing from "./pages/CreateListing";
import EditListing from "./pages/EditListing";
import Messages from "./pages/Messages";
import Favorites from "./pages/Favorites";
import BlockedUsers from "./pages/BlockedUsers";
import MyListings from "./pages/MyListings";
import MyOrders from "./pages/MyOrders";
import NotFound from "./pages/NotFound";
import VerifyEmail from "./pages/VerifyEmail";
import SellerReviews from "./pages/SellerReviews";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
        <Route path="/listing/:id/edit" element={<EditListing />} />
        <Route path="/seller/:sellerId/reviews" element={<SellerReviews />} />
        <Route path="/create" element={<CreateListing />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/blocked-users" element={<BlockedUsers />} />
        <Route path="/my-listings" element={<MyListings />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;