import type { APIRoute } from "astro";
import type { SendMessageCommand, SendMessageResponseDto, ListMessagesResponseDto } from "../../../../../types";
import { SendMessageSchema, UUIDSchema, MessageQuerySchema } from "../../../../../lib/validators/auth.validators";
import { supabaseAdminClient } from "../../../../../db/supabase.client.ts";

export const prerender = false;

export const GET: APIRoute = async ({ params, url, locals }) => {
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

    // Parse query parameters
    const searchParams = new URLSearchParams(url.search);
    const queryValidation = MessageQuerySchema.safeParse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      since: searchParams.get("since") || undefined,
    });

    if (!queryValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid query parameters",
          details: queryValidation.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { page, limit, since } = queryValidation.data;

    // Get Supabase client and user info from locals
    const supabase = locals.supabase;
    const userId = locals.userId;
    const sessionId = locals.sessionId;

    if (!supabase) {
      // Mock mode - return empty messages list
      return new Response(
        JSON.stringify({
          messages: [],
          nextPage: undefined,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if user/guest has access to this room
    let hasAccess = false;


    if (userId) {
      // Check user room membership first
      const { data: membership, error: membershipError } = await supabase
        .from("user_room")
        .select("role")
        .eq("user_id", userId)
        .eq("room_id", roomId)
        .single();


      if (membership) {
        hasAccess = true;
      } else {
        // If no direct membership, check if user can access via valid invite link
        // This allows users to access rooms through invite links without being explicitly added to user_room
        const { data: invitations, error: invitationsError } = await supabase
          .from("invitation_links")
          .select("expires_at, max_uses, uses, revoked")
          .eq("room_id", roomId);


        // Check if there's any valid invitation for this room
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
    } else if (sessionId) {
      // For guests, check if they have a valid session
      // Guests can access rooms through server invites
      hasAccess = true; // Middleware already validated guest session
    }


    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Access denied to this room" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build query with user/session info for author names
    let query = supabase
      .from("messages")
      .select(
        `
        id, user_id, session_id, content, metadata, created_at
      `
      )
      .eq("room_id", roomId);

    // Add since filter if provided (filter by message ID for more reliable incremental loading)
    if (since) {
      // since is already parsed as integer by validator
      // Validate that since is a positive integer
      if (typeof since !== 'number' || since <= 0 || !Number.isInteger(since)) {
        return new Response(
          JSON.stringify({
            error: "Invalid 'since' parameter - must be a positive integer",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      
      // For 'since' queries, we want messages newer than the given ID
      // Sort ascending to get oldest new messages first, then limit
      query = query.gt("id", since).order("created_at", { ascending: true });
      
      // Limit results for 'since' queries (don't use offset, just limit)
      query = query.limit(limit);
    } else {
      // For pagination queries, sort descending and use offset
      query = query.order("created_at", { ascending: false });
      
      // Add pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error("Failed to fetch messages:", messagesError);
      return new Response(JSON.stringify({ error: "Failed to fetch messages" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if there are more messages (for pagination)
    let hasNextPage = false;
    
    if (since) {
      // For 'since' queries, check if we got the full limit of messages
      // If we got fewer than limit, there are no more messages
      hasNextPage = messages && messages.length >= limit;
    } else {
      // For pagination queries, check total count
      const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("room_id", roomId);
      const totalMessages = count || 0;
      const offset = (page - 1) * limit;
      hasNextPage = offset + limit < totalMessages;
    }

    // Collect unique user IDs to batch fetch usernames
    const uniqueUserIds = [...new Set((messages || []).filter(m => m.user_id).map(m => m.user_id))];
    const userMap = new Map<string, { username: string; avatarUrl: string | null }>();

    // Batch fetch usernames for all users
    // Priority: user_profiles > user_metadata > email > fallback
    if (uniqueUserIds.length > 0) {
      // First, try to fetch from user_profiles table (most reliable source)
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from("user_profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", uniqueUserIds);

        if (profilesError) {
          // Table might not exist, log but continue
          console.warn(`[Messages] user_profiles table not available:`, profilesError.message);
        } else         if (profiles) {
          // Map usernames from user_profiles
          const profilesToSign: { userId: string; path: string }[] = [];

          profiles.forEach((profile) => {
            if (profile.username) {
              userMap.set(profile.user_id, { 
                username: profile.username, 
                avatarUrl: profile.avatar_url 
              });

              if (profile.avatar_url && !profile.avatar_url.includes('://')) {
                profilesToSign.push({ userId: profile.user_id, path: profile.avatar_url });
              }
            }
          });

          // Sign URLs if needed
          if (profilesToSign.length > 0 && supabaseAdminClient) {
            try {
              // Create signed URLs in parallel
              await Promise.all(profilesToSign.map(async (item) => {
                const { data } = await supabaseAdminClient.storage
                  .from('avatars')
                  .createSignedUrl(item.path, 60 * 60 * 24 * 7); // 7 days
                  
                if (data?.signedUrl) {
                  const userData = userMap.get(item.userId);
                  if (userData) {
                    userData.avatarUrl = data.signedUrl;
                    userMap.set(item.userId, userData);
                  }
                }
              }));
            } catch (signError) {
              console.warn('[Messages] Failed to sign avatar URLs:', signError);
            }
          }
        }
      } catch (error) {
        console.warn(`[Messages] Error fetching from user_profiles:`, error);
      }

      // Then, fetch from auth admin API for users not found in user_profiles
      const missingUserIds = uniqueUserIds.filter(uid => !userMap.has(uid));
      
      if (missingUserIds.length > 0 && supabaseAdminClient) {
        await Promise.all(
          missingUserIds.map(async (uid) => {
            try {
              const { data: userData, error } = await supabaseAdminClient.auth.admin.getUserById(uid);
              if (error) {
                console.error(`[Messages] Admin API error for user ${uid}:`, error.message);
                return;
              }
              if (userData?.user) {
                // Try multiple sources for username (user_metadata > email)
                const username = userData.user.user_metadata?.username || 
                                userData.user.user_metadata?.name ||
                                (userData.user.email ? userData.user.email.split("@")[0] : null);
                
                const avatarUrl = userData.user.user_metadata?.avatar_url || null;

                if (username) {
                  userMap.set(uid, { username, avatarUrl });
                } else {
                  console.warn(`[Messages] No username found for user ${uid}, metadata:`, userData.user.user_metadata);
                }
              }
            } catch (error) {
              console.error(`[Messages] Failed to fetch username for user ${uid}:`, error);
            }
          })
        );
      } else if (missingUserIds.length > 0) {
        console.warn(`[Messages] supabaseAdminClient not available, cannot fetch usernames for ${missingUserIds.length} users`);
      }
    }

    // Fetch emails for users without usernames (for better fallback)
    const usersWithoutUsernames = uniqueUserIds.filter(uid => !userMap.has(uid));
    const emailMap = new Map<string, string>();
    
    if (usersWithoutUsernames.length > 0 && supabaseAdminClient) {
      await Promise.all(
        usersWithoutUsernames.map(async (uid) => {
          try {
            const { data: userData, error } = await supabaseAdminClient.auth.admin.getUserById(uid);
            if (!error && userData?.user?.email) {
              emailMap.set(uid, userData.user.email);
            }
          } catch (error) {
            // Silently fail - we'll use ID fallback
          }
        })
      );
    }

    // Process messages to add author names and avatars
    const processedMessages = (messages || []).map((message: any) => {
      let authorName = "Nieznany";
      let avatarUrl: string | null = null;

      if (message.user_id) {
        // Use cached user info from batch fetch
        const cachedUser = userMap.get(message.user_id);
        
        if (cachedUser) {
          authorName = cachedUser.username;
          avatarUrl = cachedUser.avatarUrl;
        } else if (message.user_id === userId && locals.username) {
          // If this is the current user's message and not in map, use username from locals
          authorName = locals.username;
        } else {
          // Fallback: try email first, then user ID suffix
          const email = emailMap.get(message.user_id);
          if (email) {
            authorName = email.split("@")[0];
          } else {
            authorName = `Użytkownik ${message.user_id.slice(-6)}`;
          }
        }
      } else if (message.session_id) {
        // If this is the current guest's message, use guestNick from locals
        if (message.session_id === sessionId && locals.guestNick) {
          authorName = locals.guestNick;
        } else {
          // For guests, we'll fetch from sessions table if needed
          // For now, use session ID suffix as fallback
          authorName = `Gość ${message.session_id.slice(-6)}`;
        }
      }

      return {
        id: message.id,
        userId: message.user_id,
        sessionId: message.session_id,
        content: message.content,
        metadata: message.metadata,
        createdAt: message.created_at,
        authorName: authorName,
        avatarUrl: avatarUrl,
      };
    });

    // Fetch guest nicks for session-based messages
    const uniqueSessionIds = [...new Set((messages || []).filter(m => m.session_id && !m.user_id).map(m => m.session_id))];
    if (uniqueSessionIds.length > 0) {
      const { data: sessionData } = await supabase
        .from("sessions")
        .select("session_id, guest_nick")
        .in("session_id", uniqueSessionIds);

      if (sessionData) {
        const sessionNickMap = new Map(sessionData.map(s => [s.session_id, s.guest_nick]));
        processedMessages.forEach(msg => {
          if (msg.sessionId && !msg.userId) {
            const guestNick = sessionNickMap.get(msg.sessionId);
            if (guestNick) {
              msg.authorName = guestNick;
            } else if (msg.sessionId === sessionId && locals.guestNick) {
              msg.authorName = locals.guestNick;
            }
          }
        });
      }
    }

    const response: ListMessagesResponseDto = {
      messages: processedMessages,
      nextPage: hasNextPage ? (page + 1).toString() : undefined,
    };

    // Update room activity
    await supabase.from("rooms").update({ last_activity: new Date().toISOString() }).eq("id", roomId);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ params, request, locals }) => {
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

    // Parse request body
    let body: SendMessageCommand;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate input
    const validationResult = SendMessageSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { content } = validationResult.data;

    // Get Supabase client and user info from locals
    const supabase = locals.supabase;
    const userId = locals.userId;
    const sessionId = locals.sessionId;


    if (!supabase) {
      // Mock mode - simulate successful message send
      return new Response(
        JSON.stringify({
          id: Date.now(),
          created_at: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if user/guest has access to this room
    let hasAccess = false;


    if (userId) {
      // Check user room membership first
      const { data: membership, error: membershipError } = await supabase
        .from("user_room")
        .select("role")
        .eq("user_id", userId)
        .eq("room_id", roomId)
        .single();


      if (membership) {
        hasAccess = true;
      } else {
        // If no direct membership, check if user can access via valid invite link
        // This allows users to access rooms through invite links without being explicitly added to user_room
        const { data: invitations, error: invitationsError } = await supabase
          .from("invitation_links")
          .select("expires_at, max_uses, uses, revoked")
          .eq("room_id", roomId);


        // Check if there's any valid invitation for this room
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
    } else if (sessionId) {
      // For guests, check if they have a valid session
      hasAccess = true; // Middleware already validated guest session
    }


    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Access denied to this room" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sanitize content (basic XSS protection)
    const sanitizedContent = content
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .trim();

    // Create message
    const { data: newMessage, error: createError } = await supabase
      .from("messages")
      .insert({
        room_id: roomId,
        user_id: userId || null,
        session_id: sessionId,
        content: sanitizedContent,
        metadata: null,
      })
      .select("id, created_at")
      .single();

    if (createError || !newMessage) {
      console.error("Failed to create message:", createError);
      return new Response(JSON.stringify({ error: "Failed to send message" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update room activity
    await supabase.from("rooms").update({ last_activity: new Date().toISOString() }).eq("id", roomId);

    // Update server activity
    const { data: room } = await supabase.from("rooms").select("server_id").eq("id", roomId).single();

    if (room) {
      await supabase.from("servers").update({ last_activity: new Date().toISOString() }).eq("id", room.server_id);
    }

    const response: SendMessageResponseDto = {
      messageId: newMessage.id,
      createdAt: newMessage.created_at,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Send message error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
