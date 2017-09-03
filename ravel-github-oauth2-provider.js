'use strict';

const GitHubStrategy = require('passport-github').Strategy;
const GitHubApi = require('github');
const Ravel = require('ravel');

/**
 * A Ravel AuthorizationProvider for GitHub OAuth2.0
 */
class GitHubOauth2Provider extends Ravel.AuthenticationProvider {

  constructor(ravelInstance) {
    super(ravelInstance);
    this.github = new GitHubApi({
      version: '3.0.0',
      protocol: 'https',
      host: 'api.github.com', // should be api.github.com for GitHub
      timeout: 5000,
      headers: {
        'user-agent': 'raveljs' // GitHub is happy with a unique user agent
      }
    });

    ravelInstance.registerParameter('github auth callback url', true, 'http://localhost:8080');
    ravelInstance.registerParameter('github auth path', true, '/auth/github');
    ravelInstance.registerParameter('github auth callback path', true, '/auth/github/callback');
    ravelInstance.registerParameter('github client id', true);
    ravelInstance.registerParameter('github client secret', true);
    ravelInstance.registerParameter('github scope', false, '');
  }

  get name() {
    return 'github-oauth2';
  }

  /**
   * Initialize passport.js with a strategy
   *
   * @param koaRouter {Object} An koa-router instance
   * @param passport {Object} A passport.js object
   * @param verify {Function} See passport-github Strategy verify callback.
   *                          Should be function(accessToken, refreshToken, profile)
   *                          which returns a Promise which resolves with the profile
   */
  init(app, passport, verify) {
    passport.use(new GitHubStrategy({
      clientID: this.ravelInstance.get('github client id'),
      clientSecret: this.ravelInstance.get('github client secret'),
      callbackURL: `${this.ravelInstance.get('github auth callback url')}${this.ravelInstance.get('github auth callback path')}`,
      scope: this.ravelInstance.get('github scope')
    }, verify));


    app.get(this.ravelInstance.get('github auth path'), passport.authenticate('github'));

    app.get(this.ravelInstance.get('github auth callback path'),
      passport.authenticate('github', {
        failureRedirect: this.ravelInstance.get('login route'),
        successRedirect: this.ravelInstance.get('app route')
      })
    );
  }

  /**
   * Does this authorization provider handle the given client type?
   *
   * @param client {String} A client type, such as github-oauth2
   * @return {Boolean} true iff this provider handles the given client
   */
  handlesClient(client) {
    return client === 'github-oauth2';
  }

  /**
   * Transform a credential for an auth'd user into a user profile, iff the
   * credential is valid for this application.
   *
   * @param credential {String} A credential
   * @param client {String}  A client type, such as github-oauth2
   * @return {Promise} resolves with user profile iff the credential is valid for this application, rejects otherwise
   */
  credentialToProfile(credential, client) {
    return new Promise((resolve, reject) => {
      if (client === 'github-oauth2') {
        this.github.authenticate({
          type: 'oauth',
          token: credential
        });
        this.github.user.get({}, (err, result) => {
          if (err) { reject(err); } else { resolve(result); }
        });
      } else {
        reject(new this.ApplicationError.IllegalValue(`github-oauth2 provider cannot handle client ${client}`));
      }
    });
  };

}

module.exports = GitHubOauth2Provider;
