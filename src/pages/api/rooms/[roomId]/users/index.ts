import type { APIRoute } from "astro";
import type { RoomUserDto, ListRoomUsersResponseDto } from "../../../../../types";
import { UUIDSchema } from "../../../../../lib/validators/auth.validators";
import { supabaseAdminClient } from "../../../../../db/supabase.client";

export const prerender = false;

// Helper to resolve avatar URL (path -> signed URL)
async function resolveAvatarUrl(client: any, avatarPath: string | null): Promise<string | null> {
  if (!avatarPath) return null;
  if (avatarPath.includes("://")) return avatarPath;

  try {
    const { data, error } = await client.storage
      .from("avatars")
      .createSignedUrl(avatarPath, 60 * 60 * 24 * 7); // 7 days
    
    if (error) {
      // console.warn("[resolveAvatarUrl] Failed to sign avatar url:", error);
      return null;
    }
    return data?.signedUrl ?? null;
  } catch (error) {
    console.error("[resolveAvatarUrl] Storage error:", error);
    return null;
  }
}

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

    // Check if user has access to this room and auto-add if needed
    let hasAccess = false;
    let userRole: string | null = null;

    if (userId) {
      // Check user room membership
      const { data: membership, error: membershipError } = await supabase
        .from("user_room")
        .select("role")
        .eq("user_id", userId)
        .eq("room_id", roomId)
        .maybeSingle();

      if (membershipError && membershipError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is expected, other errors are real problems
        console.error(`[users/index] Error checking membership for user ${userId}:`, membershipError);
      }

      if (membership) {
        hasAccess = true;
        userRole = membership.role;
      } else {
        // User is not in user_room - check if they should have access
        // First, get server_id from room
        const { data: room } = await supabase
          .from("rooms")
          .select("server_id")
          .eq("id", roomId)
          .single();

        if (room) {
          // Check if user is in server (they should have access if they're in the server)
          const { data: serverMembership } = await supabase
            .from("user_server")
            .select("role")
            .eq("user_id", userId)
            .eq("server_id", room.server_id)
            .single();

          if (serverMembership) {
            // User is in server - they should have access to all rooms in the server
            hasAccess = true;
            // Auto-add user to room
            const { error: roomJoinError } = await supabase
              .from("user_room")
              .insert({
                user_id: userId,
                room_id: roomId,
                role: "Member",
              });

            if (!roomJoinError) {
              userRole = "Member";
              console.log(`[users/index] Auto-added user ${userId} to room ${roomId} (via server membership)`);
            } else {
              // Check if it's a duplicate key error (user already exists)
              if (roomJoinError.code === '23505' || roomJoinError.message?.includes('duplicate')) {
                console.log(`[users/index] User ${userId} already in room ${roomId} (race condition)`);
                userRole = "Member";
                hasAccess = true;
              } else {
                console.error(`[users/index] Failed to auto-add user ${userId} to room ${roomId}:`, roomJoinError);
                // Still grant access even if insert fails
                userRole = "Member";
              }
            }
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
              
              // Add to server if not already a member
              await supabase
                .from("user_server")
                .insert({
                  user_id: userId,
                  server_id: room.server_id,
                  role: "Member",
                });

              // Add to room
              const { error: roomJoinError } = await supabase
                .from("user_room")
                .insert({
                  user_id: userId,
                  room_id: roomId,
                  role: "Member",
                });

              if (!roomJoinError) {
                userRole = "Member";
                console.log(`[users/index] Auto-added user ${userId} to room ${roomId} (via invite link)`);
              } else {
                // Check if it's a duplicate key error (user already exists)
                if (roomJoinError.code === '23505' || roomJoinError.message?.includes('duplicate')) {
                  console.log(`[users/index] User ${userId} already in room ${roomId} (race condition)`);
                  userRole = "Member";
                  hasAccess = true;
                } else {
                  console.error(`[users/index] Failed to auto-add user ${userId} to room ${roomId}:`, roomJoinError);
                  // Still grant access even if insert fails
                  userRole = "Member";
                }
              }
            }
          }
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
    // If we just added the user, fetch again to include them
    let { data: roomUsers, error: usersError } = await supabase
      .from("user_room")
      .select(`
        role,
        user_id,
        created_at
      `)
      .eq("room_id", roomId);
    
    console.log(`[users/index] Fetched ${roomUsers?.length || 0} users for room ${roomId}, current userId: ${userId}`);

    if (usersError) {
      console.error("Failed to fetch room users:", usersError);
      return new Response(JSON.stringify({ error: "Failed to fetch room users" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If we just added the user, fetch again to make sure they're included
    if (userRole && userId) {
      const userInList = roomUsers?.some(u => u.user_id === userId);
      if (!userInList) {
        console.log(`[users/index] User was just added but not in list, fetching again...`);
        const { data: refreshedUsers } = await supabase
          .from("user_room")
          .select(`
            role,
            user_id,
            created_at
          `)
          .eq("room_id", roomId);
        roomUsers = refreshedUsers;
        console.log(`[users/index] After refresh: ${roomUsers?.length || 0} users`);
      }
    }

    // Get user details from auth.users and check online status
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000).toISOString();

    // Use admin client for fetching user data to bypass RLS policies on user_profiles
    // and to allow access to auth.admin methods
    const dataClient = supabaseAdminClient || supabase;
    
    if (!supabaseAdminClient) {
      console.warn("[users/index] SUPABASE_SERVICE_ROLE_KEY not set, falling back to user client. Some user data may be missing due to RLS.");
    }

    // Process users from user_room table using parallel promises for better performance
    const userPromises = (roomUsers || []).map(async (roomUser) => {
      try {
        // Check if this is the current user making the request
        const isCurrentUser = userId && roomUser.user_id === userId;
        
        // Get user details from Supabase Auth
        let authUser = null;
        let authError = null;
        
        if (supabaseAdminClient) {
             const result = await supabaseAdminClient.auth.admin.getUserById(roomUser.user_id);
             authUser = result.data;
             authError = result.error;
        }
        
        // Determine online status
        // Current user is always online
        let isOnline = isCurrentUser;
        
        if (!isOnline) {
          // Check presence for other users - they are online if they have a recent presence record
          const { data: presence } = await dataClient
            .from("user_presence")
            .select("last_seen")
            .eq("user_id", roomUser.user_id)
            .eq("room_id", roomId)
            .gt("last_seen", sixtySecondsAgo)
            .limit(1);

          isOnline = !!(presence && presence.length > 0);
        }
        
        // Extract username - try multiple sources
        let username = `User-${roomUser.user_id.slice(-6)}`; // Fallback
        let email: string | undefined = undefined;
        let avatarUrl: string | null = null;
        
        // Try user_profiles first (most reliable)
        let profile = null;
        try {
          const { data } = await dataClient
            .from("user_profiles")
            .select("username, display_name, avatar_url")
            .eq("user_id", roomUser.user_id)
            .maybeSingle();
          profile = data;
        } catch (e) {
          console.warn(`[users/index] Profile lookup failed for ${roomUser.user_id}`, e);
        }

        if (profile?.username) {
          username = profile.display_name || profile.username;
          avatarUrl = profile.avatar_url;
        } else if (authUser?.user) {
           username = authUser.user.user_metadata?.username || 
                     authUser.user.user_metadata?.name ||
                     (authUser.user.email ? authUser.user.email.split("@")[0] : username);
           avatarUrl = authUser.user.user_metadata?.avatar_url || null;
        }

        if (authUser?.user) {
           email = authUser.user.email;
        } else if (authError) {
          // Only log if we really expected to find the user (not for deleted users still in room)
          // console.warn(`[users/index] Auth lookup failed for user ${roomUser.user_id}:`, authError.message);
        }

        // Resolve avatar URL if it's a path
        if (avatarUrl) {
          avatarUrl = await resolveAvatarUrl(dataClient, avatarUrl);
        }

        return {
          id: roomUser.user_id,
          username,
          email,
          role: roomUser.role as RoomUserDto['role'],
          isOnline,
          joinedAt: roomUser.created_at,
          avatarUrl,
        };
      } catch (error) {
        console.error(`[users/index] Failed to process user ${roomUser.user_id}:`, error);
        // Return user with minimal info if processing fails
        const isCurrentUser = userId && roomUser.user_id === userId;
        return {
          id: roomUser.user_id,
          username: `User-${roomUser.user_id.slice(-6)}`,
          role: roomUser.role as RoomUserDto['role'],
          isOnline: isCurrentUser,
          joinedAt: roomUser.created_at,
          avatarUrl: null
        };
      }
    });

    // Wait for all users to be processed
    const users: RoomUserDto[] = await Promise.all(userPromises);

    // ALWAYS ensure current user is in the list if they have access
    if (userId && hasAccess) {
      const currentUserInList = users.some(u => u.id === userId);
      
      if (!currentUserInList) {
        console.log(`[users/index] Current user has access but not in list, adding...`);
        
        // Use data from locals (set by middleware) - more reliable than admin API
        const username = locals.username || 
                        (locals.user?.email ? locals.user.email.split('@')[0] : undefined) ||
                        `User-${userId.slice(-6)}`;
        const email = locals.user?.email;
        
        // Try to get user from admin API if available (for more complete data)
        try {
          const client = supabaseAdminClient || supabase;
          let authUser = null;
          
          if (supabaseAdminClient) {
             const res = await supabaseAdminClient.auth.admin.getUserById(userId);
             authUser = res.data;
          }

          let finalUsername = username;
          let avatarUrl = null;

          if (authUser?.user) {
            // Try user_profiles for current user too
             const { data: profile } = await client
              .from("user_profiles")
              .select("username, display_name, avatar_url")
              .eq("user_id", userId)
              .maybeSingle();

            if (profile?.username) {
               finalUsername = profile.display_name || profile.username;
               avatarUrl = profile.avatar_url;
            } else {
              const metadataUsername = authUser.user.user_metadata?.username;
              finalUsername = metadataUsername || 
                                   (authUser.user.email ? authUser.user.email.split('@')[0] : undefined) ||
                                   username;
              avatarUrl = authUser.user.user_metadata?.avatar_url || null;
            }
            
            // Resolve avatar URL
            if (avatarUrl) {
              avatarUrl = await resolveAvatarUrl(client, avatarUrl);
            }
            
            users.push({
              id: userId,
              username: finalUsername,
              email: authUser.user.email || email,
              role: (userRole || 'Member') as RoomUserDto['role'],
              isOnline: true, // Current user is always online
              joinedAt: new Date().toISOString(),
              avatarUrl
            });
            console.log(`[users/index] Added current user: ${finalUsername}`);
          } else {
            // Fallback to locals data
            users.push({
              id: userId,
              username,
              email,
              role: (userRole || 'Member') as RoomUserDto['role'],
              isOnline: true,
              joinedAt: new Date().toISOString(),
              avatarUrl: null
            });
            console.log(`[users/index] Added current user (fallback): ${username}`);
          }
        } catch (error) {
          // Fallback to locals data if admin API fails
          console.warn(`[users/index] Admin API failed, using locals data:`, error);
          users.push({
            id: userId,
            username,
            email,
            role: (userRole || 'Member') as RoomUserDto['role'],
            isOnline: true,
            joinedAt: new Date().toISOString(),
            avatarUrl: null
          });
          console.log(`[users/index] Added current user (locals fallback): ${username}`);
        }
      } else {
        // Ensure current user is marked as online even if already in list
        const currentUserIndex = users.findIndex(u => u.id === userId);
        if (currentUserIndex >= 0) {
          users[currentUserIndex].isOnline = true;
        }
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
