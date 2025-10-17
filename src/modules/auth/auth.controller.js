import { asyncHandler } from "../../core/utils/async-handler.js";
import User from "../../models/User.model.js";
import { ApiError } from "../../core/utils/api-error.js";
import { ApiResponse } from "../../core/utils/api-response.js";
import { userForgotPasswordMailBody, userVerificationMailBody } from "../../shared/constants/mail.constant.js";
import { mailTransporter } from "../../shared/helpers/mail.helper.js";
import { storeAccessToken, storeLoginCookies } from "../../shared/helpers/cookies.helper.js";

const registerUser = asyncHandler(async (req, res) => {
    const { userName, userEmail, userPassword, userRole, phoneNumber,userAddress } = req.body
    const existingUser = await User.findOne({ userEmail })
    if (existingUser) {
        throw new ApiError(400, "User already exists")
    }

    const user = await User.create({
        userName,
        userEmail,
        userPassword,
        userRole,
        phoneNumber,
        userAddress,
    })

    if (!user) {
        throw new ApiError(400, "User not Created");
    }

    const {unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken()

    user.userVerificationToken = hashedToken
    user.userVerificationTokenExpiry = tokenExpiry
    await user.save()

    console.log("User created:", user);
    

    const userVerificationEmailLink = `${process.env.BASE_URL}/api/v1/auth/verify/${unHashedToken}`

    await mailTransporter.sendMail({
        from: process.env.MAILTRAP_SENDEREMAIL,
        to: userEmail,
        subject: "Verify your email",
        html: userVerificationMailBody(userName, userVerificationEmailLink),
    })

    const response = {
        userName: user.userName,
        userEmail: user.userEmail,
        userRole: user.userRole,
        phoneNumber: user.phoneNumber,
        userAddress: user.userAddress,
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                response,
                "User created successfully"
            )
        );


})

// const logInUser = asyncHandler(async (req, res) => {
//   const { userEmail, userPassword } = req.body;

//   const user = await User.findOne({ userEmail });
//   if (!user) throw new ApiError(400, "User not found");

//   const isPasswordCorrect = await user.isPasswordCorrect(userPassword);
//   if (!isPasswordCorrect) throw new ApiError(400, "Invalid password");

//   if (!user.userIsVerified) throw new ApiError(400, "User not verified");

//   // Generate tokens
//   const accessToken = user.generateAccessToken();
//   const refreshToken = user.generateRefreshToken();

//   // 🟢 Store cookies with "user" role context
//   await storeLoginCookies(res, accessToken, refreshToken, "user");

//   user.userRefreshToken = refreshToken;
//   await user.save();

//   // 🟢 Dynamic role-based keys (e.g. buyer_accessToken)
//   const roleKey = user.userRole.replace(/-/g, "_");

//   return res.status(200).json(
//     new ApiResponse(
//       200,
//       {
//         user: {
//           userName: user.userName,
//           userEmail: user.userEmail,
//           userRole: user.userRole,
//           phoneNumber: user.phoneNumber,
//         },
//         tokens: {
//           [`${roleKey}_accessToken`]: accessToken,
//           [`${roleKey}_refreshToken`]: refreshToken,
//         },
//       },
//       `${user.userRole} logged in successfully`
//     )
//   );
// });


const logInUser = asyncHandler(async (req, res) => {

    const { userEmail, userPassword } = req.body
    const user = await User.findOne({ userEmail })
    if (!user) {
        throw new ApiError(400, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(userPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid password");
    }

    if (!user.userIsVerified) {
        throw new ApiError(400, "User not verified");
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    storeLoginCookies(res, accessToken, refreshToken, "user");

    user.userRefreshToken = refreshToken
    await user.save()

    const response = {
        user: {
            userName: user.userName,
            userEmail: user.userEmail,
            userRole: user.userRole,
            phoneNumber: user.phoneNumber
        },
        tokens: {
            accessToken,
            refreshToken
        }
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                response,
                "User logged in successfully"
            )
        );


})

const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user?._id; // assuming `req.user` is set by auth middleware

    if (!userId) {
        throw new ApiError(401, "User not authenticated");
    }

    // Clear refresh token from database
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.userRefreshToken = null;
    await user.save();

    // Clear cookies (for web clients)
    res.clearCookie("accessToken", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const verifyUserMail = asyncHandler(async (req, res) => {
    const { token } = req.params
    if (!token) {
        throw new ApiError(400, "Token not found")
    }
const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
        userVerificationToken: hashedToken,
        userVerificationTokenExpiry: { $gt: Date.now() }
    })
    if (!user) {
        throw new ApiError(400, "Invalid or expired verification token");
    }

    user.userIsVerified = true;
    user.userVerificationToken = null;
    user.userVerificationTokenExpiry = null;
    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "User verified successfully"));
})

const getAccessToken = asyncHandler(async (req, res) => {
    const { userRefreshToken } = req.cookies; // ✅ updated cookie name
    if (!userRefreshToken) throw new ApiError(400, "Refresh token not found");

    const user = await User.findOne({ userRefreshToken });
    if (!user) throw new ApiError(400, "Invalid refresh token");

    const accessToken = await user.generateAccessToken();

    // ✅ Pass "user" role for correct cookie key
    await storeAccessToken(res, accessToken, "user");

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { accessToken },
                "User access token generated successfully"
            )
        );
});


const forgotPasswordMail = asyncHandler(async (req, res) => {
    const { userEmail } = req.body;

    const user = await User.findOne({ userEmail });
    if (!user) {
        throw new ApiError(400, "User not found");
    }

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();

    // Store hashed token in DB
    user.userPasswordResetToken = hashedToken;
    user.userPasswordExpirationDate = tokenExpiry;
    await user.save();

    // Send unhashed token to user via email
    const userPasswordResetLink = `${process.env.BASE_URL}/api/v1/auth/reset-password/${unHashedToken}`;

    await mailTransporter.sendMail({
        from: process.env.MAILTRAP_SENDEREMAIL,
        to: userEmail,
        subject: "Reset your password",
        html: userForgotPasswordMailBody(user.userName, userPasswordResetLink),
    });

    return res.status(201).json(
        new ApiResponse(201, { userPasswordResetLink }, "Password reset link sent successfully")
    );
});


import crypto from "crypto";

const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { userPassword } = req.body;

    // Hash the token from email to match DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        userPasswordResetToken: hashedToken,
        userPasswordExpirationDate: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired password reset token");
    }

    user.userPassword = userPassword;
    user.userPasswordResetToken = null;
    user.userPasswordExpirationDate = null;
    await user.save();

    return res.status(201).json(new ApiResponse(201, {}, "Password reset successfully"));
});


export { registerUser, logInUser, logoutUser, verifyUserMail, getAccessToken, forgotPasswordMail, resetPassword }