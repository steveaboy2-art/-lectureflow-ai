export default async function handler(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  return Response.json({ clientId });
}
