// import { ApiError } from "../utils/api-error.js";
// import { asyncHandler } from "../utils/async-handler.js";
// import { ZodError } from "zod";

// const validate = (schema) =>
//   asyncHandler(async (req, res, next) => {
//     try {
//       // 🧩 Handle single or multiple schema validation
//       if (schema?.safeParse) {

//         schema.parse(req.body);
//       } else {
//         if (schema?.body) schema.body.parse(req.body);
//         if (schema?.query) schema.query.parse(req.query);
//         if (schema?.params) schema.params.parse(req.params);
//       }

//       next();
//     } catch (error) {
//       if (error instanceof ZodError) {
//         // ✅ Handle both .issues and .errors arrays safely
//         const zodErrors = error.issues || error.errors || [];

//         const formattedErrors = zodErrors.map((err) => ({
//           field: err?.path?.join(".") || "unknown",
//           message: err?.message || "Invalid input",
//         }));

//         throw new ApiError(400, "Validation failed", formattedErrors);
//       }

//       // 🔥 Unexpected validation errors
//       console.error("Unexpected validation error:", error);
//       throw new ApiError(500, "Unexpected validation error", [
//         { message: error.message },
//       ]);
//     }
//   });

// export { validate };

import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ZodError } from "zod";

/**
 * ✅ Universal validation middleware for Zod schemas
 * Supports:
 * - Single schema (schema.parse)
 * - Multiple schemas (body, query, params)
 * Handles Zod errors and converts them into ApiError for uniform API responses.
 */
const validate = (schema) =>
  asyncHandler(async (req, res, next) => {
    try {
      // 🧩 Handle single or multiple schema structures
      if (schema?.safeParse) {
        // Single schema (used directly)
        schema.parse(req.body);
      } else {
        // Multi-part schema (body, query, params)
        if (schema?.body) schema.body.parse(req.body);
        if (schema?.query) schema.query.parse(req.query);
        if (schema?.params) schema.params.parse(req.params);
      }

      // ✅ Continue to next middleware or controller
      next();
    } catch (error) {
      // 🧠 If error is a Zod validation error
      if (error instanceof ZodError) {
        const zodErrors = error.issues || error.errors || [];

        // Format all Zod error messages neatly
        const formattedErrors = zodErrors.map((err) => ({
          field: err?.path?.join(".") || "unknown",
          message: err?.message || "Invalid input",
        }));

        // Throw custom ApiError with 400 status
        throw new ApiError(400, "Validation failed", formattedErrors);
      }

      // 🔥 Unexpected validation or runtime error
      console.error("Unexpected validation error:", error);
      throw new ApiError(500, "Unexpected validation error", [
        { message: error.message },
      ]);
    }
  });

export { validate };
