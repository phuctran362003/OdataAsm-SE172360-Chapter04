using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace OdataAsm_SE172360_Chapter04.API.Utils;

public static class GenerateJWTToken
{
    public static JwtSecurityToken CreateToken(List<Claim> authClaims, IConfiguration configuration,
        DateTime currentTime)
    {
        var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["JWT:SecretKey"]));
        _ = int.TryParse(configuration["JWT:TokenValidityInMinutes"], out var tokenValidityInMinutes);

        var token = new JwtSecurityToken(
            configuration["JWT:ValidIssuer"],
            configuration["JWT:ValidAudience"],
            expires: currentTime.AddMinutes(tokenValidityInMinutes),
            claims: authClaims,
            signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
        );

        return token;
    }
}