'use strict';

const GitHubStrategy = require('passport-github').Strategy;
const GitHubApi = require('github');
const Ravel = require('ravel');

/**
 * A Ravel AuthorizationProvider for GitHub OAuth2.0
 */
class GitHubOauth2Provider extends Ravel.AuthorizationProvider {

  constructor(ravelInstance) {
    super('github-oauth2');
    this.github = new GitHubApi({
      version: '3.0.0',
      protocol: 'https',
      host: 'api.github.com', // should be api.github.com for GitHub
      timeout: 5000,
      headers: {
        'user-agent': 'raveljs' // GitHub is happy with a unique user agent
      }
    });
    this.ravelInstance = ravelInstance;
    this.log = ravelInstance.log.getLogger(this.name);
    this.ApplicationError = ravelInstance.ApplicationError;
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
      callbackURL: `${this.ravelInstance.get('github auth callback url')}${this.ravelInstance.get('github auth callback path')}`
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
          if (err) {reject(err);} else {resolve(result);}
        });
      } else {
        reject(new this.ApplicationError.IllegalValue(`github-oauth2 provider cannot handle client ${client}`));
      }
    });
  };

}

/**
 * Add a new GitHubOauth2Provider to a Ravel instance
 *
 * @param {Object} ravelInstance a reference to a Ravel instance
 */
module.exports = function(ravelInstance) {
  const githubProvider = new GitHubOauth2Provider(ravelInstance);

  // register github as an auth provider
  const providers = ravelInstance.get('authorization providers');
  providers.push(githubProvider);
  ravelInstance.set('authorization providers', providers);

  // required github parameters
  ravelInstance.registerParameter(`github auth callback url`, true, 'http://localhost:8080');
  ravelInstance.registerParameter(`github auth path`, true, '/auth/github');
  ravelInstance.registerParameter(`github auth callback path`, true, '/auth/github/callback');
  ravelInstance.registerParameter(`github client id`, true);
  ravelInstance.registerParameter(`github client secret`, true);

  ravelInstance.once('pre listen', () => {
    ravelInstance.log.debug('Using GitHub OAuth2 provider');
  });
};
