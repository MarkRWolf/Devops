using System.Net;
using System.Net.Mail;

public class BrevoEmailSender : IEmailSender
{
    private readonly IConfiguration cfg;

    public BrevoEmailSender(IConfiguration cfg)
    {
        this.cfg = cfg;
    }

    public async Task SendAsync(string to, string subject, string htmlBody)
    {
        using var client = new SmtpClient("smtp-relay.brevo.com", 587)
        {
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(
                cfg["Brevo:User"],
                cfg["Brevo:Password"]
            ),
            EnableSsl = true
        };

        using var msg = new MailMessage(cfg["Brevo:From"], to, subject, htmlBody)
        { IsBodyHtml = true };

        await client.SendMailAsync(msg);
    }
}

