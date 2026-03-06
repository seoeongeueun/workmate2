import {NextResponse} from "next/server";

export async function POST(request: Request): Promise<Response> {
	try {
		const {inputKey} = await request.json();

		const storedKey = process.env.MANAGE_ACCESS;

		if (!storedKey || !inputKey) return NextResponse.json({success: false, error: {message: "Missing Access Key", code: "MISSING_ACCESS_KEY"}}, {status: 400});

		if (inputKey === storedKey) return NextResponse.json({success: true, data: {}});
		else return NextResponse.json({success: false, error: {message: "Invalid Key", code: "INVALID_KEY"}}, {status: 401});
	} catch (error) {
		return NextResponse.json({success: false, error: {message: "Server Error", code: "INTERNAL"}}, {status: 500});
	}
}
