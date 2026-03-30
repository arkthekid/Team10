import { Router } from "express";
import * as productController from "../controllers/productControllers";

const productRoutes = Router();

productRoutes.post("/", productController.createProduct);
productRoutes.get("/", productController.getAllProducts);
productRoutes.get("/:id", productController.getProductByID);
productRoutes.patch("/:id", productController.updateProduct);
productRoutes.delete("/:id", productController.deleteProduct);

export default productRoutes;