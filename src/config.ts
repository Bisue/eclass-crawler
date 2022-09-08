import dotenv from "dotenv";

dotenv.config();

const id = process.env.STD_ID ?? "";
const pw = process.env.STD_PW ?? "";

export default { id, pw };
