import fs from "fs";
import path from "path";
import crypto from "crypto";

function getEncryptedFilePath() {
	if (process.env.NODE_ENV === "development") {
		return path.join(process.cwd(), "env.enc.json");
	} else {
		// 빌드 후엔 process.resourcesPath가
		// "<어플리케이션>.app/Contents/Resources" 가 됨
		return path.join(process.resourcesPath, "env.enc.json");
	}
}

export function loadEncryptedEnv() {
	const filePath = getEncryptedFilePath();
	if (!fs.existsSync(filePath)) {
		console.warn("env.enc.json 파일을 찾을 수 없습니다.");
		return {};
	}
	const {iv, data} = JSON.parse(fs.readFileSync(filePath, "utf-8"));

	const ALGORITHM = "aes-256-cbc";
	const KEY = Buffer.from((window as any).env.ENCRYPTION_KEY || "UFWtsYJji5qlXkQSRioY6lb+YzqyBEN4Ido68Yvu3AM=", "base64");
	console.log("!!: ", (window as any).env.ENCRYPTION_KEY);
	const ivBuf = Buffer.from(iv, "base64");
	const decipher = crypto.createDecipheriv(ALGORITHM, KEY, ivBuf);

	let decrypted = decipher.update(data, "base64", "utf8");
	decrypted += decipher.final("utf8");

	const envObj: Record<string, string> = {};
	const lines = decrypted.split("\n").filter(line => !!line.trim());
	lines.forEach(line => {
		const [k, v] = line.split("=");
		if (k && v !== undefined) {
			envObj[k.trim()] = v.trim();
		}
	});

	Object.entries(envObj).forEach(([k, v]) => {
		process.env[k] = v;
	});

	return envObj;
}
