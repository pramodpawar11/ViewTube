import dotenv from "dotenv";
const PORT = process.env.PORT || 3001;
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
  path: "./env",
});
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`PORT is running of ${PORT}`));
  })
  .catch((error) => {
    console.log("Error occured in databse", error);
  });
