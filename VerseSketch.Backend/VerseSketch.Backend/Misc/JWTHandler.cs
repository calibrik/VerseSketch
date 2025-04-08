using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace VerseSketch.Backend.Misc;

public static class JWTHandler
{
    public static string CreateToken(string playerId,IConfiguration configuration)
    {
        string? issuer = configuration["JwtConfig:Issuer"];
        string? audience = configuration["JwtConfig:Audience"];
        string? key = configuration["JwtConfig:Key"];
        SecurityTokenDescriptor tokenDescriptor = new SecurityTokenDescriptor()
        {
            Subject = new ClaimsIdentity([
                new Claim("PlayerId", playerId)
            ]),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.ASCII.GetBytes(key)),
                SecurityAlgorithms.HmacSha256Signature)
        };
        JwtSecurityTokenHandler tokenHandler = new JwtSecurityTokenHandler();
        SecurityToken securityToken = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(securityToken);
    }
}