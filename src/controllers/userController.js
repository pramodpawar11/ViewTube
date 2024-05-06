import { User } from "../models/userModal.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";

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
  const avatarLocalPath = req.file?.avatar[0]?.path;
  const coverImageLocalPath = req.file?.coverImage[0]?.path;
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
export { registerUser };
