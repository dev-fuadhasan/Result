import { Handler } from '@netlify/functions';

const handler: Handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message: 'Test function working!',
      path: event.path,
      method: event.httpMethod,
      timestamp: new Date().toISOString(),
    }),
  };
};

export { handler }; 