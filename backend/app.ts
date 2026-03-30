import express from "express";
import router from "./src/routes/productRoutes";
import { errorHandler } from "./src/middleware/errorHandler";

const app = express();

app.use(express.json());

// Mount router
app.use("/api/product", router);

app.use(errorHandler)

export default app;