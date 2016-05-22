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
  "github auth path": "/auth/github",
  "github auth callback path": "/auth/github/callback",
  "github client id": "YOUR_CLIENT_ID",
  "github client secret" : "YOUR_CLIENT_SECRET"  
}
```

Note that `github auth callback url` should be the external url for your application. Only change `github auth path` and `github auth callback path` if those routes collide with your application - otherwise they will receive the given default values.

You'll also need to implement an `@authconfig` module like this:

*modules/authconfig.js*
```js
'use strict';

const Ravel = require('ravel');
const Module = Ravel.Module;
const authconfig = Module.authconfig;

@authconfig
class AuthConfig extends Module {
  getUserById(userId) {
    // TODO hit redis to get access token, then hit github API or redis to get profile object.
    return Promise.resolve({id: userId, username: 'Ghnuberath'});
  }

  verifyCredentials(accessToken, refreshToken, profile) {
    // TODO store accessToken and profile if we want to, in session (i.e. redis)
    return Promise.resolve(profile);
  }
}

module.exports = AuthConfig;
```
