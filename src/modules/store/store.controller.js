
import Store from "../../models/Store.model.js";
import User from "../../models/User.model.js";

// ---------- CREATE STORE ----------
export const createStore = async (req, res) => {
  try {
    const {
      storeName,
      storeLogo,
      storeCoverImage,
      storeDescription,
      storeCategoryId,
      idCardNumber,
      idCardImage,
    } = req.body;

    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const existingStore = await Store.findOne({ userID: userId });
    if (existingStore)
      return res
        .status(400)
        .json({ success: false, message: "User already owns a store" });

    const newStore = await Store.create({
      userID: userId,
      storeName,
      storeLogo,
      storeCoverImage,
      storeDescription,
      storeCategoryId: storeCategoryId || null,
      idCardNumber: idCardNumber,
      idCardImage,
    });

    res.status(201).json({
      success: true,
      message: "Store created successfully",
      data: newStore,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ---------- GET STORE DETAILS ----------
export const getStoreDetails = async (req, res) => {
  try {
    const userId = req.user._id;

    const store = await Store.findOne({ userID: userId })
      .populate("storeCategoryId", "categoryName categoryType");

    if (!store) return res.status(404).json({ message: "User does not have a Store" });

    res.status(200).json({ success: true, data: store });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};


// ---------- UPDATE STORE ----------
export const updateStore = async (req, res) => {
  try {
     const userId = req.user._id;
    const updates = req.body;

    const store = await Store.findOne({ userID: userId });
    if (!store) return res.status(404).json({ message: "Store not found" });

    const allowedFields = ["storeName", "storeLogo", "storeCoverImage", "storeDescription", "storeCategoryId"];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) store[field] = updates[field];
    });

    await store.save();
    res.status(200).json({ success: true, message: "Store updated successfully", data: store });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

// ---------- DELETE STORE ----------
export const deleteStore = async (req, res) => {
  try {
     const userId = req.user._id;

    const store = await Store.findOne({ userID: userId });
    if (!store) return res.status(404).json({ message: "Store not found" });

    await store.deleteOne();
    res.status(200).json({ success: true, message: "Store deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};
export const getAllStores = async (req, res, next) => {
  try {
    const stores = await Store.find().populate("storeCategoryId"); // populates category name/type
    res.status(200).json({
      success: true,
      message: "All stores fetched successfully",
      data: stores,
    });
  } catch (error) {
    next(error);
  }
};