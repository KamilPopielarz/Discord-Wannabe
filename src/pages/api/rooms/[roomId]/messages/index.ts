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
      query = query.gt("id", since).order("created_at", { ascending: true }); // Ascending for new messages
    } else {
      query = query.order("created_at", { ascending: false }); // Descending for pagination
    }

    // Add pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error("Failed to fetch messages:", messagesError);
      return new Response(JSON.stringify({ error: "Failed to fetch messages" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if there are more messages (for pagination)
    const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("room_id", roomId);

    const totalMessages = count || 0;
    const hasNextPage = offset + limit < totalMessages;

    // Collect unique user IDs to batch fetch usernames
    const uniqueUserIds = [...new Set((messages || []).filter(m => m.user_id).map(m => m.user_id))];
    const usernameMap = new Map<string, string>();

    // Batch fetch usernames for all users
    if (uniqueUserIds.length > 0 && supabaseAdminClient) {
      await Promise.all(
        uniqueUserIds.map(async (uid) => {
          try {
            const { data: userData, error } = await supabaseAdminClient.auth.admin.getUserById(uid);
            if (error) {
              console.error(`Admin API error for user ${uid}:`, error);
              return;
            }
            if (userData?.user) {
              // Try multiple sources for username
              const username = userData.user.user_metadata?.username || 
                              userData.user.user_metadata?.name ||
                              (userData.user.email ? userData.user.email.split("@")[0] : null);
              if (username) {
                usernameMap.set(uid, username);
              } else {
                console.warn(`No username found for user ${uid}, metadata:`, userData.user.user_metadata);
              }
            }
          } catch (error) {
            console.error(`Failed to fetch username for user ${uid}:`, error);
          }
        })
      );
    } else if (uniqueUserIds.length > 0) {
      console.warn("supabaseAdminClient not available, cannot fetch usernames");
    }

    // Process messages to add author names
    const processedMessages = (messages || []).map((message: any) => {
      let authorName = "Nieznany";

      if (message.user_id) {
        // If this is the current user's message, use username from locals first
        if (message.user_id === userId && locals.username) {
          authorName = locals.username;
        } else {
          // Use cached username from batch fetch
          const cachedUsername = usernameMap.get(message.user_id);
          if (cachedUsername) {
            authorName = cachedUsername;
          } else {
            // Fallback: use user ID suffix
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
