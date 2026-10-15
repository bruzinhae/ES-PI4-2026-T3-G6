package br.faculdade.acaistudy.websocket;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.Locale;
import java.util.regex.Pattern;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import br.faculdade.acaistudy.model.AuthSession;
import br.faculdade.acaistudy.model.UserAccount;
import br.faculdade.acaistudy.repository.UserAccountRepository;

@Component
public class AuthWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(AuthWebSocketHandler.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Duration SESSION_LIFETIME = Duration.ofDays(7);

    private final ObjectMapper objectMapper;
    private final UserAccountRepository users;
    private final MongoTemplate mongoTemplate;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthWebSocketHandler(
            ObjectMapper objectMapper,
            UserAccountRepository users,
            MongoTemplate mongoTemplate,
            PasswordEncoder passwordEncoder) {
        this.objectMapper = objectMapper;
        this.users = users;
        this.mongoTemplate = mongoTemplate;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String requestId = null;
        String responseType = "auth.error";
        try {
            JsonNode request = objectMapper.readTree(message.getPayload());
            requestId = text(request, "requestId");
            String type = text(request, "type");
            JsonNode payload = request.path("payload");

            ObjectNode data = switch (type) {
                case "auth.register" -> {
                    responseType = "auth.register.result";
                    yield register(payload);
                }
                case "auth.login" -> {
                    responseType = "auth.login.result";
                    yield login(payload);
                }
                case "auth.me" -> {
                    responseType = "auth.me.result";
                    yield currentUser(payload);
                }
                case "auth.logout" -> {
                    responseType = "auth.logout.result";
                    yield logout(payload);
                }
                default -> throw new AuthException("OPERATION_UNKNOWN", "Operação de autenticação desconhecida.");
            };
            send(session, responseType, requestId, true, null, null, data);
        } catch (AuthException exception) {
            send(session, responseType, requestId, false, exception.code, exception.getMessage(), null);
        } catch (DuplicateKeyException exception) {
            send(session, responseType, requestId, false, "EMAIL_ALREADY_EXISTS", "Já existe uma conta com esse e-mail.", null);
        } catch (Exception exception) {
            log.error("Authentication WebSocket message failed", exception);
            send(session, responseType, requestId, false, "INTERNAL_ERROR", "Ocorreu um erro no servidor. Tente novamente.", null);
        }
    }

    private ObjectNode register(JsonNode payload) {
        String name = text(payload, "name").trim();
        String email = text(payload, "email").trim();
        String password = text(payload, "password");
        String normalizedEmail = email.toLowerCase(Locale.ROOT);

        if (name.length() < 3 || name.length() > 100) {
            throw new AuthException("INVALID_NAME", "Informe um nome com 3 a 100 caracteres.");
        }
        if (!EMAIL_PATTERN.matcher(email).matches() || email.length() > 254) {
            throw new AuthException("INVALID_EMAIL", "Informe um endereço de e-mail válido.");
        }
        if (password.length() < 8 || password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new AuthException("INVALID_PASSWORD", "A senha deve ter ao menos 8 caracteres e no máximo 72 bytes UTF-8.");
        }
        if (!payload.path("acceptedTerms").asBoolean(false)) {
            throw new AuthException("TERMS_REQUIRED", "É necessário aceitar os termos para criar a conta.");
        }
        if (users.findByNormalizedEmail(normalizedEmail).isPresent()) {
            throw new AuthException("EMAIL_ALREADY_EXISTS", "Já existe uma conta com esse e-mail.");
        }

        UserAccount user = new UserAccount();
        user.setName(name);
        user.setEmail(email);
        user.setNormalizedEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setCreatedAt(Instant.now());
        user.setTermsAcceptedAt(Instant.now());
        user = users.save(user);
        return createSession(user);
    }

    private ObjectNode login(JsonNode payload) {
        String email = text(payload, "email").trim().toLowerCase(Locale.ROOT);
        String password = text(payload, "password");
        UserAccount user = users.findByNormalizedEmail(email)
                .orElseThrow(() -> new AuthException("INVALID_CREDENTIALS", "E-mail ou senha incorretos."));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new AuthException("INVALID_CREDENTIALS", "E-mail ou senha incorretos.");
        }
        return createSession(user);
    }

    private ObjectNode currentUser(JsonNode payload) {
        UserAccount user = userForToken(text(payload, "token"));
        ObjectNode data = objectMapper.createObjectNode();
        data.set("user", publicUser(user));
        return data;
    }

    private ObjectNode logout(JsonNode payload) {
        String token = text(payload, "token");
        if (!token.isBlank()) {
            mongoTemplate.remove(org.springframework.data.mongodb.core.query.Query.query(
                    org.springframework.data.mongodb.core.query.Criteria.where("_id").is(hashToken(token))),
                    AuthSession.class);
        }
        return objectMapper.createObjectNode();
    }

    private UserAccount userForToken(String token) {
        if (token.isBlank()) {
            throw new AuthException("SESSION_EXPIRED", "Sua sessão expirou. Entre novamente.");
        }
        AuthSession authSession = mongoTemplate.findById(hashToken(token), AuthSession.class);
        if (authSession == null || authSession.getExpiresAt().before(new Date())) {
            throw new AuthException("SESSION_EXPIRED", "Sua sessão expirou. Entre novamente.");
        }
        return users.findById(authSession.getUserId())
                .orElseThrow(() -> new AuthException("SESSION_EXPIRED", "Sua sessão expirou. Entre novamente."));
    }

    private ObjectNode createSession(UserAccount user) {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        AuthSession authSession = new AuthSession();
        authSession.setTokenHash(hashToken(token));
        authSession.setUserId(user.getId());
        authSession.setCreatedAt(Instant.now());
        authSession.setExpiresAt(Date.from(Instant.now().plus(SESSION_LIFETIME)));
        mongoTemplate.save(authSession);

        ObjectNode data = objectMapper.createObjectNode();
        data.put("token", token);
        data.put("expiresAt", authSession.getExpiresAt().toInstant().toString());
        data.set("user", publicUser(user));
        return data;
    }

    private ObjectNode publicUser(UserAccount user) {
        ObjectNode data = objectMapper.createObjectNode();
        data.put("id", user.getId());
        data.put("name", user.getName());
        data.put("email", user.getEmail());
        return data;
    }

    private String hashToken(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (Exception exception) {
            throw new IllegalStateException("Não foi possível processar a sessão.", exception);
        }
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || value.isNull() ? "" : value.asText("");
    }

    private void send(WebSocketSession session, String type, String requestId, boolean success,
                      String error, String message, ObjectNode data) throws Exception {
        ObjectNode response = objectMapper.createObjectNode();
        response.put("type", type);
        if (requestId != null) response.put("requestId", requestId);
        response.put("success", success);
        if (error != null) response.put("error", error);
        if (message != null) response.put("message", message);
        if (data != null) response.set("data", data);
        synchronized (session) {
            if (session.isOpen()) session.sendMessage(new TextMessage(objectMapper.writeValueAsString(response)));
        }
    }

    private static final class AuthException extends RuntimeException {
        private final String code;
        private AuthException(String code, String message) {
            super(message);
            this.code = code;
        }
    }
}
