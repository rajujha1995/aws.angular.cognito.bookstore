// src/environments/environment.prod.ts
export const environment = {
  production: true,
  book_apiUrl:
    'https://82b8crgwq6.execute-api.us-east-1.amazonaws.com/prod/api/books',
  cognito: {
    userPoolId: 'us-east-1_IrGCvOnYo',
    userPoolWebClientId: '2ri1tj57559n89jebur2d9h6j9',
    region: 'us-east-1',
  },
  redirect_uri:
    'http://aws.bookstore.ui.s3-website-us-east-1.amazonaws.com/home',
  grant_type: 'authorization_code',
  oauth2_token_url:
    'https://bookstoren01649102.auth.us-east-1.amazoncognito.com/oauth2/token',
  content_type: 'application/x-www-form-urlencoded',
};
