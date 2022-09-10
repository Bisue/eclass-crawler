import dotenv from 'dotenv';

dotenv.config();

// 학번
const id = process.env.STD_ID ?? '';
// 비밀번호
const pw = process.env.STD_PW ?? '';

export default { id, pw };
