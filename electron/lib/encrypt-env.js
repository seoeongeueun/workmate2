import fs from "fs";
import {fileURLToPath} from "url";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";

// ESM에서 __dirname 흉내내기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({path: path.resolve(__dirname, "../../.env")});

const ALGORITHM = "aes-256-cbc";
const KEY = Buffer.from(process.env.ENCRYPTION_KEY || "UFWtsYJji5qlXkQSRioY6lb+YzqyBEN4Ido68Yvu3AM=", "base64");
const IV = crypto.randomBytes(16);

const envPath = path.join(__dirname, "../../.env");
if (!fs.existsSync(envPath)) {
	console.error(".env 파일이 없습니다.");
	process.exit(1);
}
const envContent = fs.readFileSync(envPath, "utf-8");

function encrypt(text) {
	const cipher = crypto.createCipheriv(ALGORITHM, KEY, IV);
	let encrypted = cipher.update(text, "utf8", "base64");
	encrypted += cipher.final("base64");
	return encrypted;
}

const encryptedData = encrypt(envContent);

// 암호화된 값 + IV를 JSON에 담아 저장
const output = {
	iv: IV.toString("base64"),
	data: encryptedData,
};
fs.writeFileSync("env.enc.json", JSON.stringify(output, null, 2), "utf-8");

console.log("암호화된 env.enc.json 생성 완료");
