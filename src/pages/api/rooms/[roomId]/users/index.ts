import type { APIRoute } from "astro";
import type { RoomUserDto, ListRoomUsersResponseDto } from "../../../../../types";
import { UUIDSchema } from "../../../../../lib/validators/auth.validators";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { roomId } = params;

    // Validate room ID parameter
    const roomIdValidation = UUIDSchema.safeParse(roomId);
    if (!roomIdValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid room ID format",
          details: roomIdValidation.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get Supabase client and user info from locals
    const supabase = locals.supabase;
    const userId = locals.userId;

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user has access to this room
    let hasAccess = false;

    if (userId) {
      // Check user room membership
      const { data: membership } = await supabase
        .from("user_room")
        .select("role")
        .eq("user_id", userId)
        .eq("room_id", roomId)
        .single();

      if (membership) {
        hasAccess = true;
      } else {
        // Check if user can access via valid invite link
        const { data: invitations } = await supabase
          .from("invitation_links")
          .select("expires_at, max_uses, uses, revoked")
          .eq("room_id", roomId);

        const validInvitation = invitations?.find(
          (invitation) =>
            !invitation.revoked &&
            (!invitation.expires_at || new Date(invitation.expires_at) > new Date()) &&
            (!invitation.max_uses || invitation.uses < invitation.max_uses)
        );

        if (validInvitation) {
          hasAccess = true;
        }
      }
    } else {
      // For guests, allow access if they have a valid session
      // Middleware already validated guest session
      hasAccess = true;
    }

    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Access denied to this room" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get room users with their auth info
    const { data: roomUsers, error: usersError } = await supabase
      .from("user_room")
      .select(`
        role,
        user_id,
        created_at
      `)
      .eq("room_id", roomId);

    if (usersError) {
      console.error("Failed to fetch room users:", usersError);
      return new Response(JSON.stringify({ error: "Failed to fetch room users" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user details from auth.users and check online status
    const userIds = roomUsers?.map(u => u.user_id) || [];
    const users: RoomUserDto[] = [];

    for (const roomUser of roomUsers || []) {
      try {
        // Get user details from Supabase Auth
        const { data: authUser } = await supabase.auth.admin.getUserById(roomUser.user_id);
        
        if (authUser.user) {
          // Check if user is online by looking for recent auth sessions
          const { data: sessions } = await supabase
            .from("auth_sessions")
            .select("expires_at")
            .eq("user_id", roomUser.user_id)
            .gt("expires_at", new Date().toISOString())
            .limit(1);

          const isOnline = sessions && sessions.length > 0;
          
          // Extract username from metadata or fallback to email
          const username = authUser.user.user_metadata?.username || 
                          authUser.user.email?.split('@')[0] || 
                          `User-${roomUser.user_id.slice(-6)}`;

          users.push({
            id: roomUser.user_id,
            username,
            email: authUser.user.email,
            role: roomUser.role as RoomUserDto['role'],
            isOnline,
            joinedAt: roomUser.created_at,
          });
        }
      } catch (error) {
        console.error(`Failed to get user details for ${roomUser.user_id}:`, error);
        // Add user with minimal info if auth lookup fails
        users.push({
          id: roomUser.user_id,
          username: `User-${roomUser.user_id.slice(-6)}`,
          role: roomUser.role as RoomUserDto['role'],
          isOnline: false,
          joinedAt: roomUser.created_at,
        });
      }
    }

    // Sort users by role priority, then by online status, then by username
    const rolePriority = { 'Owner': 4, 'Admin': 3, 'Moderator': 2, 'Member': 1, 'Guest': 0 };
    users.sort((a, b) => {
      const roleDiff = rolePriority[b.role] - rolePriority[a.role];
      if (roleDiff !== 0) return roleDiff;
      
      const onlineDiff = Number(b.isOnline) - Number(a.isOnline);
      if (onlineDiff !== 0) return onlineDiff;
      
      return a.username.localeCompare(b.username);
    });

    const response: ListRoomUsersResponseDto = {
      users,
      totalCount: users.length,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("List room users error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
