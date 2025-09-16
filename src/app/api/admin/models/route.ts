import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import dbConnect from "../../../../lib/mongodb";
import { AIPlatform } from "../../../../lib/models";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        console.log('GET /api/admin/models - session:', session?.user?.email, 'isAdmin:', session?.user?.isAdmin, 'userId:', session?.user?.id);

        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const platforms = await AIPlatform.find({ userId: session.user.id }).select('-apiKey');
        console.log('Found platforms:', platforms.length);

        // Convert _id to id for frontend compatibility
        const platformsWithId = platforms.map(platform => ({
            ...platform.toObject(),
            id: platform._id.toString()
        }));

        return NextResponse.json(platformsWithId);
    } catch (error) {
        console.error("Error fetching platforms:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, apiKey, endpoint, isActive } = body;

        if (!name || !apiKey || !endpoint) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await dbConnect();

        // Ensure we have a user ID
        if (!session.user.id) {
            return NextResponse.json({ error: "User ID not found in session" }, { status: 400 });
        }

        const existingPlatform = await AIPlatform.findOne({
            name: name,
            userId: session.user.id
        });

        if (existingPlatform) {
            return NextResponse.json({ error: "Platform already exists" }, { status: 400 });
        }

        const platform = await AIPlatform.create({
            name,
            apiKey,
            endpoint,
            isActive: isActive ?? true,
            userId: session.user.id
        });

        const { apiKey: _, ...platformWithoutKey } = platform.toObject();
        const platformResponse = {
            ...platformWithoutKey,
            id: platform._id.toString()
        };
        return NextResponse.json(platformResponse, { status: 201 });
    } catch (error) {
        console.error("Error creating platform:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}