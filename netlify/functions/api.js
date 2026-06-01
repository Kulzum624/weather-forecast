exports.handler = async (event) => {
  const API_KEY = process.env.API_KEY;
  const { endpoint, ...params } = event.queryStringParameters || {};

  if (!endpoint) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing endpoint parameter" })
    };
  }

  const queryParams = new URLSearchParams({
    ...params,
    appid: API_KEY
  }).toString();

  const url = `https://api.openweathermap.org/data/${endpoint}?${queryParams}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    return {
      statusCode: response.status,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
