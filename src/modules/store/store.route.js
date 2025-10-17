import express from "express";
import { isLoggedIn } from "../../core/middleware/isLoggedIn.js";
import { authorizeRoles } from "../../core/middleware/authorizeRoles.js";
import { createStore, getStoreDetails, updateStore, deleteStore } from "./store.controller.js";

const router = express.Router();

// All routes protected, only store-admin can access
router.post("/createStore", isLoggedIn, authorizeRoles("store-admin"), createStore);
router.get("/getStore", isLoggedIn, authorizeRoles("store-admin"), getStoreDetails);
router.put("/updateStore", isLoggedIn, authorizeRoles("store-admin"), updateStore);
router.delete("/deleteStore", isLoggedIn, authorizeRoles("store-admin"), deleteStore);

export default router;
