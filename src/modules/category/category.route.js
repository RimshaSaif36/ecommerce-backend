import express from "express";
import { validate } from "../../core/middleware/validate.js";
import { storeCategorySchema } from "../../shared/validators/category.validation.js";
import {
  createCategory,
  getAllCategories,
  getStoreCategories,
  getFactoryCategories, 
} from "./category.controller.js";

const categoryRouter = express.Router();

categoryRouter.post("/createCategory", validate(storeCategorySchema), createCategory);
categoryRouter.get("/getallcategories", getAllCategories);
categoryRouter.get("/storecategory", getStoreCategories);
categoryRouter.get("/factorycategory", getFactoryCategories);

export default categoryRouter;
