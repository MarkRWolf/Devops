using devops.data;
using devops.models;
using microsoft.aspnetcore.authorization;
using microsoft.aspnetcore.identity;
using microsoft.aspnetcore.mvc;
using microsoft.entityframeworkcore;
using system.security.claims;
using system.text.json;

namespace devops.controllers;

[apicontroller]
[route("api/account")]
public class accountcontroller : controllerbase
{
    private readonly usermanager<devopsuser> _users;
    private readonly ilogger<accountcontroller> _logger;
    private readonly ihttpclientfactory _httpclientfactory;

    public accountcontroller(
        usermanager<devopsuser> users,
        ilogger<accountcontroller> logger,
        ihttpclientfactory httpclientfactory)
    {
        _users = users;
        _logger = logger;
        _httpclientfactory = httpclientfactory;
    }

    [authorize]
    [httpget("me")]
    public async task<actionresult<devopsuser.public>> me()
    {
        var sub = user.findfirstvalue("sub");
        if (string.isnullorwhitespace(sub))
        {
            _logger.logwarning("me: missing 'sub' claim. claims: {claims}", string.join(", ", user.claims.select(c => $"{c.type}={c.value}")));
            return unauthorized();
        }

        var user = await _users.users.firstordefaultasync(u => u.hydrasubject == sub);
        if (user == null)
        {
            var kratosadminbase = environment.getenvironmentvariable("kratos_admin_url") ?? "http://kratos:4434";
            var client = _httpclientfactory.createclient();
            httpresponsemessage resp;

            try
            {
                resp = await client.getasync($"{kratosadminbase}/admin/identities/{sub}");
            }
            catch (exception ex)
            {
                _logger.logerror(ex, "me: failed to call kratos admin for sub {sub}", sub);
                return unauthorized();
            }

            if (!resp.issuccessstatuscode)
            {
                _logger.logerror("me: kratos admin returned {statuscode} for sub {sub}", resp.statuscode, sub);
                return unauthorized();
            }

            string? email = null;
            string? preferredusername = null;

            try
            {
                await using var stream = await resp.content.readasstreamasync();
                using var doc = await jsondocument.parseasync(stream);
                var root = doc.rootelement;

                if (root.trygetproperty("traits", out var traits))
                {
                    if (traits.trygetproperty("email", out var emailprop) && emailprop.valuekind == jsonvaluekind.string)
                        email = emailprop.getstring();

                    if (traits.trygetproperty("username", out var usernameprop) && usernameprop.valuekind == jsonvaluekind.string)
                        preferredusername = usernameprop.getstring();
                }
            }
            catch (exception ex)
            {
                _logger.logerror(ex, "me: failed to parse kratos identity for sub {sub}", sub);
                return unauthorized();
            }

            if (string.isnullorwhitespace(email))
            {
                _logger.logerror("me: kratos identity for sub {sub} has no email trait", sub);
                return unauthorized();
            }

            var username = string.isnullorwhitespace(preferredusername) ? email : preferredusername;

            _logger.loginformation("me: creating user for hydra sub {sub} with username {username} and email {email}", sub, username, email);

            user = new devopsuser
            {
                username = username!,
                email = email!,
                hydrasubject = sub
            };

            var create = await _users.createasync(user);
            if (!create.succeeded)
            {
                var errors = string.join("; ", create.errors.select(e => $"{e.code}: {e.description}"));
                _logger.logerror("me: failed to create user for hydra sub {sub}. errors: {errors}", sub, errors);
                return unauthorized();
            }
        }

        return ok(user.topublic());
    }
}

