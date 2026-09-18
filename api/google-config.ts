const CLIENT_ID = '14663212067-eb2lvc5qorg89vdgeod530ssaoaa2d1f.apps.googleusercontent.com';

export default async function handler(req: Request) {
  return Response.json({ clientId: CLIENT_ID });
}
