import { User } from "../models/userModal.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong in Tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, password, userName, fullName } = req.body;
  if (
    [email, password, userName, fullName].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const checkUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (checkUser) throw new ApiError(409, "User already exists");
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required");

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) throw new ApiError(400, "Avatar file is required");

  const user = await User.create({
    userName: userName.toLowerCase(),
    password,
    email,
    coverImage: coverImage?.url || "",
    avatar: avatar?.url,
    fullName,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser)
    throw new ApiError(500, "Something went wrong while regitering user");

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, userName, password } = req.body;
  if (!email && !userName) {
    throw new ApiError(400, "username or email is required");
  }
  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (!user) throw new ApiError(401, "User is not found");
  const validatePassword = await user.isCorrectPassword(password);
  if (!validatePassword) throw new ApiError(401, "Password is incorrect");
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshTokens(user._id);
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const option = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const option = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "User logged-out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized token");
  const decodeRefreshToken = jwt.verify(
    incomingRefreshToken,
    REFRESH_TOKEN_SECRET
  );
  if (!decodeRefreshToken) throw new ApiError(401, "Invalid token");
  const user = await User.findById(decodeRefreshToken?._id);
  if (!user) throw new ApiError(401, "Invalid search token");
  if (incomingRefreshToken !== user.refreshToken)
    throw new ApiError(401, "Refresh token is expired or used");
  const options = {
    httpOnly: true,
    secure: true,
  };
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshTokens(user._id);
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: accessToken, refreshToken },
        "Tokens created successfully"
      )
    );
});

const updateUserPassword = asyncHandler(async (req, res) => {
  const { oldpassword, newpassword } = req.body;
  const user = await User.findById(req.user._id);
  const isPawwordCorrect = await user.isCorrectPassword(oldpassword);
  if (!isPawwordCorrect) throw new ApiError(401, "Password is incorrect");
  user.password = newpassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(ApiResponse(200), {}, "Password updated successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { email, userName } = req.body;
  if (!fullName || !email) throw new ApiError(400, "All fields are required");
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        email,
        userName,
      },
    },
    { new: true }
  ).select("-password");
  res
    .status(200)
    .json(ApiResponse(200, { user }, "Details updated successfully"));
});

const updateAvatar = asyncHandler(async(req,res)=>{
  const avatarLocalPath = req.file?.path;
  if(!avatarLocalPath) throw new ApiError(400,"not getting avatar file path");
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if(!avatar.url) throw new ApiError(401,"facing problem while uploading on cloudnary")
  const user = await User.findById(req.user._id,{
    $set:{
      avatar:avatar?.url
    }
  },{
    new:true
  })
  res.status(200).json(new ApiResponse(200,user,"Avatar updated successfully"));
})
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updateAccountDetails,
  updateUserPassword,
  updateAvatar
};
