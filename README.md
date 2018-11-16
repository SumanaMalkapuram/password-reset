# custom-password-reset

## Basic steps to set this up

1. Create a Management API Machine to Machine client with scopes required to get a user. Look at the management api docs at https://auth0.com/docs/api/management/v2#!/Users/get_users
    - Note the client_id and client_secret for Machine to Machine client created above

2. Initialize the webtask container within your Auth0 tenant ![https://manage.auth0.com/#/tenant/webtasks]
-- In Mac, in a terminal create a random secret example : openssl rand 32 -base64, note this secret


```
wt create --name password-reset --secret token_secret=<secret created in step above> --secret auth0_domain=<tenant>.auth0.com --secret management_api_client_id=<client_id_mgmt_api> --secret management_api_client_secret=<client_secret_mgmt_api> --profile "tenant-default" password-reset.js
```
3. You are done.

### Usage
1. Configure lock to use your own reset-password screen
var options = {
forgotPasswordLink: 'https://<<Webtask-URL>>/password-reset'
};
https://auth0.com/docs/libraries/lock/v11/configuration#forgotpasswordlink-string-

2. The password reset webtask requires an email and connection as the query parameters.
3. Fetches user profile based on the email from a backend service (Auth0 in this webtask, but can be changed to any service).
4. Customizes the email based on the user profile fetched and creates a change password ticket.