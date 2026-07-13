import mongoose from "mongoose";
const data=new mongoose.Schema({
   name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
export default mongoose.model("logindata", data); 