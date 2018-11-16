
let Express = require('express');
let Webtask = require('webtask-tools');
let bodyParser = require('body-parser@1.12.4');
let tools = require('auth0-extension-tools@1.2.1');
let helper = require('sendgrid@4.7.0').mail;






var app = Express();

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 


app.get('/', async function(req, res) {
    var email = req.query.email;
    var connection = req.query.connection;
   
    if (email)
    {
        try {
            var createPasswordChangeLinkResponse = await createPasswordChangeLink(req.webtaskContext, email);
        } catch(e) {
            console.log(e);
            res.send(500);
            return;
        }
    }
    res.send("Sent an email");
    
});

var GetClient = async ({ auth0_domain, management_api_client_id, management_api_client_secret }) => {
    //console.log(tools);
    return tools.managementApi.getClient({
        domain: auth0_domain,
        clientId: management_api_client_id,
        clientSecret: management_api_client_secret
    });
};

var ChangePassword = async (client, email, connection_id = connection) => {
    return client.tickets.changePassword({
        result_url: '<<redirect URI>>',  // Redirect after using the ticket.
        email,  // Optional.
        connection_id
    });
};

var GetUserByEmail = async (client, email) => {
    return await client.users.getByEmail(email);
};

var SendEmail = async (webtaskContext,toEmail, userLocale, ticketUrl) => {
    var user_metadata = userLocale.user_metadata;
    var locale = user_metadata.locale || 'EN';
    
    var fromEmail = new helper.Email('<<fromemail address>>');

    var {subject, html} = GetLocaleData(locale, fromEmail, ticketUrl);
    var content = new helper.Content('text/html', html);
    var mail = new helper.Mail(fromEmail, subject, toEmail, content);
 
    var sg = require('sendgrid@4.7.0')(webtaskContext.secrets.sendgrid_key);
    var request = sg.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: mail.toJSON()
    });
 
    var sendMailResponse = await sg.API(request); 
    return sendMailResponse;
   
};

var createPasswordChangeLink = async (webtaskContext, email, cb) => {

    var client = await GetClient(webtaskContext.secrets);
    console.log(client);
    var changePasswordResponse = await ChangePassword(client, email);
    console.log(changePasswordResponse);
    var userLocale = await GetUserByEmail(client, email);  //Using Auth0 to retrieve the profile. Profile can be fetched via a backend DB/service 
    console.log(userLocale);
    //sendgrid.setApiKey(webtaskContext.secrets.sendgrid_key);
    var sendMailResponse = await SendEmail( webtaskContext,email,userLocale[0], changePasswordResponse.ticket);
    return sendMailResponse;

};

function GetLocaleData(locale, email, url)
{
    var html = `    
        <html>  
            <head>
                <style type="text/css">.ExternalClass,.ExternalClass div,.ExternalClass font,.ExternalClass p,.ExternalClass span,.ExternalClass td,img{line-height:100%}#outlook a{padding:0}.ExternalClass,.ReadMsgBody{width:100%}a,blockquote,body,li,p,table,td{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0;mso-table-rspace:0}img{-ms-interpolation-mode:bicubic;border:0;height:auto;outline:0;text-decoration:none}table{border-collapse:collapse!important}#bodyCell,#bodyTable,body{height:100%!important;margin:0;padding:0;font-family:ProximaNova,sans-serif}#bodyCell{padding:20px}#bodyTable{width:600px}@font-face{font-family:ProximaNova;src:url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-regular-webfont-webfont.eot);src:url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-regular-webfont-webfont.eot?#iefix) format('embedded-opentype'),url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-regular-webfont-webfont.woff) format('woff');font-weight:400;font-style:normal}@font-face{font-family:ProximaNova;src:url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-semibold-webfont-webfont.eot);src:url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-semibold-webfont-webfont.eot?#iefix) format('embedded-opentype'),url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-semibold-webfont-webfont.woff) format('woff');font-weight:600;font-style:normal}@media only screen and (max-width:480px){#bodyTable,body{width:100%!important}a,blockquote,body,li,p,table,td{-webkit-text-size-adjust:none!important}body{min-width:100%!important}#bodyTable{max-width:600px!important}#signIn{max-width:280px!important}}
                </style>
            </head>
            <body>
                <center>
                    <table style="width: 600px;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;margin: 0;padding: 0;font-family: &quot;ProximaNova&quot;, sans-serif;border-collapse: collapse !important;height: 100% !important;" align="center" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable">
                    <tr>
                        <td align="center" valign="top" id="bodyCell" style="-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;margin: 0;padding: 20px;font-family: &quot;ProximaNova&quot;, sans-serif;height: 100% !important;">
                        <div class="main">
                        <p style="text-align: center;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%; margin-bottom: 30px;">
                            <img src="https://cdn.auth0.com/styleguide/2.0.9/lib/logos/img/badge.png" width="50" alt="Your logo goes here" style="-ms-interpolation-mode: bicubic;border: 0;height: auto;line-height: 100%;outline: none;text-decoration: none;">
                        </p>

                        <h1>Password Change Request</h1>

                        <p>You have submitted a password change request. </p>

                        <p>If it wasn't you please disregard this email and make sure you can still login to your account. If it was you, then <strong>confirm the password change <a href="${url}">click here</a></strong>.</p>

                        <br>
                        Thanks!
                        <br>

                        <strong>${email}</strong>

                        <br><br>
                        <hr style="border: 2px solid #EAEEF3; border-bottom: 0; margin: 20px 0;">
                        <p style="text-align: center;color: #A9B3BC;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;">
                            If you did not make this request, please contact us by replying to this mail.
                        </p>
                        </div>
                        </td>
                    </tr>
                    </table>
                </center>
            </body>
        </html>`;
    var subject = `Change Password - Auth0 ${locale}`;
    return {subject, html};
}


module.exports = Webtask.fromExpress(app);
