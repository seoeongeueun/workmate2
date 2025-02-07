import {NextResponse} from "next/server";

export async function POST(request: Request) {
	try {
		const {inputKey} = await request.json();

		const storedKey = process.env.MANAGE_ACCESS;

		if (!storedKey || !inputKey) return NextResponse.json({error: "Missing Access Key"}, {status: 400});

		if (inputKey === storedKey) return NextResponse.json({success: true});
		else return NextResponse.json({error: "Invalid Key"}, {status: 401});
	} catch (error) {
		return NextResponse.json({error: "Server Error"}, {status: 500});
	}
}
