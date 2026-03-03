import { Router } from "express";
import * as productController from "../controllers/productControllers";

const productRoutes = Router();

productRoutes.post("/", productController.createProduct);
productRoutes.get("/", productController.getAllProducts);
// productRoutes.get("/:id", userController.getProduct);
// productRoutes.patch("/", userController.updateProduct);
// productRoutes.delete("/:id", userController.deleteProduct);

export default productRoutes;



