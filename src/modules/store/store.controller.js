// import Store from "../../models/Store.model.js";
// import User from "../../models/User.model.js";

// export const createStore = async (req, res) => {
//   try {
//     const { storeName, storeLogo, storeCoverImage, storeDescription, storeCategoryId, idCardNumber, idCardImage } = req.body;
//     const userId = req.user._id;
//     // assuming JWT middleware attaches user data

//     // 1️⃣ Check if user exists
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // 2️⃣ Check if user already owns a store
//     const existingStore = await Store.findOne({ userID: userId });
//     if (existingStore) {
//       return res.status(400).json({ message: "User already owns a store" });
//     }

//     const newStore = await Store.create({
//       userID: userId,
//       storeName,
//       storeLogo,
//       storeCoverImage,
//       storeDescription,
//       storeCategoryId: storeCategoryId || null, // optional
//       idCardNumber: idCardNumber ? idCardNumber.replace(/-/g, "").substring(0, 20) : null,
//       idCardImage: idCardImage || null,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Store created successfully and is pending approval by admin",
//       data: newStore,
//     });
//   } catch (error) {
//     console.error("Error creating store:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
//   }
// };



import Store from "../../models/Store.model.js";
import User from "../../models/User.model.js";

// ---------- CREATE STORE ----------
export const createStore = async (req, res) => {
  try {
    const { storeName, storeLogo, storeCoverImage, storeDescription, storeCategoryId, idCardNumber, idCardImage } = req.body;
     const userId = req.user._id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if user already owns a store
    const existingStore = await Store.findOne({ userID: userId });
    if (existingStore) return res.status(400).json({ message: "User already owns a store" });

    const newStore = await Store.create({
      userID: userId,
      storeName,
      storeLogo: storeLogo || null,
      storeCoverImage: storeCoverImage || null,
      storeDescription: storeDescription || "",
      storeCategoryId: storeCategoryId || null,
      idCardNumber: idCardNumber?.slice(0, 13) || null,
      idCardImage: idCardImage || null,
    });

    res.status(201).json({ success: true, message: "Store created successfully", data: newStore });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

// ---------- GET STORE DETAILS ----------
export const getStoreDetails = async (req, res) => {
  try {
    const userId = req.user._id;

    const store = await Store.findOne({ userID: userId });
    if (!store) return res.status(404).json({ message: "User do not have a Store" });

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
