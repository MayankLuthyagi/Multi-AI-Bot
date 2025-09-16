import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/authOptions";
import dbConnect from "../../../../../lib/mongodb";
import { AIPlatform } from "../../../../../lib/models";
import mongoose from "mongoose";

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        await dbConnect();

        const platform = await AIPlatform.findOneAndUpdate(
            {
                _id: params.id,
                userId: session.user.id
            },
            body,
            {
                new: true,
                select: '-apiKey'
            }
        );

        if (!platform) {
            return NextResponse.json({ error: "Platform not found" }, { status: 404 });
        }

        const platformResponse = {
            ...platform.toObject(),
            id: platform._id.toString()
        };
        return NextResponse.json(platformResponse);
    } catch (error) {
        console.error("Error updating platform:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        console.log('DELETE request for platform ID:', params.id);
        const session = await getServerSession(authOptions);
        console.log('Session user:', session?.user?.email, 'isAdmin:', session?.user?.isAdmin, 'userId:', session?.user?.id);

        if (!session?.user?.isAdmin) {
            console.log('Unauthorized: User is not admin');
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!session.user.id) {
            console.log('Error: User ID is missing from session');
            return NextResponse.json({ error: "User ID not found in session" }, { status: 400 });
        }

        await dbConnect();

        console.log('Attempting to delete platform with ID:', params.id, 'for user:', session.user.id);

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(params.id)) {
            console.log('Invalid ObjectId format:', params.id);
            return NextResponse.json({ error: "Invalid platform ID format" }, { status: 400 });
        }

        const platform = await AIPlatform.findOneAndDelete({
            _id: params.id,
            userId: session.user.id
        });

        if (!platform) {
            console.log('Platform not found for deletion - ID:', params.id, 'UserID:', session.user.id);
            return NextResponse.json({ error: "Platform not found" }, { status: 404 });
        }

        console.log('Platform deleted successfully:', platform.name);
        return NextResponse.json({ message: "Platform deleted successfully" });
    } catch (error) {
        console.error("Error deleting platform:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}