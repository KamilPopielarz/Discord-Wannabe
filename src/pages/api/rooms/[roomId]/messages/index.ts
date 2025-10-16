import type { APIRoute } from "astro";
import type { SendMessageCommand, SendMessageResponseDto, ListMessagesResponseDto } from "../../../../../types";
import { SendMessageSchema, UUIDSchema, MessageQuerySchema } from "../../../../../lib/validators/auth.validators";

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
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user/guest has access to this room
    let hasAccess = false;

    if (userId) {
      // Check user room membership
      const { data: membership } = await supabase
        .from("user_room")
        .select("role")
        .eq("user_id", userId)
        .eq("room_id", roomId)
        .single();

      hasAccess = !!membership;
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

    // Build query
    let query = supabase
      .from("messages")
      .select("id, user_id, session_id, content, metadata, created_at")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    // Add since filter if provided
    if (since) {
      query = query.gt("created_at", since);
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
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId);

    const totalMessages = count || 0;
    const hasNextPage = offset + limit < totalMessages;

    const response: ListMessagesResponseDto = {
      messages: messages || [],
      nextPage: hasNextPage ? (page + 1).toString() : undefined,
    };

    // Update room activity
    await supabase
      .from("rooms")
      .update({ last_activity: new Date().toISOString() })
      .eq("id", roomId);

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
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user/guest has access to this room
    let hasAccess = false;

    if (userId) {
      // Check user room membership
      const { data: membership } = await supabase
        .from("user_room")
        .select("role")
        .eq("user_id", userId)
        .eq("room_id", roomId)
        .single();

      hasAccess = !!membership;
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
    await supabase
      .from("rooms")
      .update({ last_activity: new Date().toISOString() })
      .eq("id", roomId);

    // Update server activity
    const { data: room } = await supabase
      .from("rooms")
      .select("server_id")
      .eq("id", roomId)
      .single();

    if (room) {
      await supabase
        .from("servers")
        .update({ last_activity: new Date().toISOString() })
        .eq("id", room.server_id);
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
