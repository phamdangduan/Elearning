package com.example.Elearning.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.stream.Collectors;

/**
 * Converts a decoded JWT into a Spring Security Authentication object.
 *
 * Reads the "scope" claim (space-separated role strings, e.g. "ROLE_STUDENT ROLE_ADMIN")
 * and maps each token to a SimpleGrantedAuthority with NO additional prefix (setAuthorityPrefix("")).
 *
 * The principal of the resulting JwtAuthenticationToken is the Jwt itself,
 * so downstream code can extract userId via:
 *   ((Jwt) auth.getPrincipal()).getClaim("userId")
 */
@Component
public class JwtAuthConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<SimpleGrantedAuthority> authorities = extractAuthorities(jwt);
        return new JwtAuthenticationToken(jwt, authorities);
    }

    private Collection<SimpleGrantedAuthority> extractAuthorities(Jwt jwt) {
        String scope = jwt.getClaimAsString("scope");
        if (!StringUtils.hasText(scope)) {
            return Collections.emptyList();
        }
        return Arrays.stream(scope.split(" "))
                .filter(StringUtils::hasText)
                .map(SimpleGrantedAuthority::new)   // No prefix — roles already contain "ROLE_"
                .collect(Collectors.toList());
    }
}
