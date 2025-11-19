import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const { data: { session } } = await locals.supabase.auth.getSession();

  if (!session) {
    return new Response(JSON.stringify({ error: "No session" }), { 
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ access_token: session.access_token }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

