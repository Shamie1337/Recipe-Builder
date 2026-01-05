using System.Net;
using System.Net.Mail;

namespace RecipeBuilder.API.Services
{
    public class EmailService
    {
        public void SendVerificationEmail(string toEmail, string code)
        {
            
            var fromEmail = "nikolashalamanov999@gmail.com"; 
            var appPassword = "wguamxaudlnibesw"; 

            var smtpClient = new SmtpClient("smtp.gmail.com")
            {
                Port = 587,
                Credentials = new NetworkCredential(fromEmail, appPassword),
                EnableSsl = true,
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(fromEmail),
                Subject = "Код за потвърждение - RecipeBuilder",
                Body = $"Здравей! Твоят код за потвърждение е: <h1>{code}</h1>",
                IsBodyHtml = true,
            };

            mailMessage.To.Add(toEmail);

            smtpClient.Send(mailMessage);
        }
    }
}