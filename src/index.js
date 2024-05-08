import dotenv from "dotenv";
dotenv.config({
  path: "./env",
});
import connectDB from "./db/index.js";
import { app } from "./app.js";
const PORT = process.env.PORT || 3001;
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`PORT is running on ${PORT}`));
  })
  .catch((error) => {
    console.log("Error occured in databse", error);
  });
