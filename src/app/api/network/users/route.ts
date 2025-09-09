import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check for authentication token in headers
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Verify token with auth service
    // For now, assume token is valid and extract user info
    
    const body = await request.json();
    const { name, email, role, collegeId, department, year } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required" },
        { status: 400 }
      );
    }

    // TODO: Create user in database
    const user = {
      id: Date.now().toString(),
      name,
      email,
      role,
      collegeId: collegeId || null,
      department: department || null,
      year: year || null,
    };

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
