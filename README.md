# ravel-github-oauth2-provider

> Ravel AuthorizationProvider for Github OAuth2

## Example usage:

*app.js*
```javascript
const app = new require('ravel')();
require('ravel-github-oauth2-provder')(app);

// ... the rest of your Ravel app
```

## Configuration

Requiring the `ravel-github-oauth2-provider` module will register configuration parameters with Ravel which must be supplied via `.ravelrc` or `app.set()`:

*.ravelrc*
```json
{
  "github auth callback url" : "http://localhost:8080",
  "github client id": "YOUR_CLIENT_ID",
  "github client secret" : "YOUR_CLIENT_SECRET"
}
```

Note that `github auth callback url` should be the external url for your application.
