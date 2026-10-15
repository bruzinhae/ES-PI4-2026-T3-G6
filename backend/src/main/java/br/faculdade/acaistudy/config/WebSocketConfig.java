package br.faculdade.acaistudy.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import br.faculdade.acaistudy.websocket.AuthWebSocketHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final AuthWebSocketHandler authHandler;
    private final String[] allowedOrigins;

    public WebSocketConfig(
            AuthWebSocketHandler authHandler,
            @Value("${app.websocket.allowed-origins}") String[] allowedOrigins) {
        this.authHandler = authHandler;
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(authHandler, "/ws")
                .setAllowedOrigins(allowedOrigins);
    }
}
