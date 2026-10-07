package br.faculdade.acaistudy.config;

import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

@Component
public class MongoConnectionLogger {

    private static final Logger log = LoggerFactory.getLogger(MongoConnectionLogger.class);

    private final MongoTemplate mongoTemplate;

    public MongoConnectionLogger(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void verificarConexao() {
        try {
            Document resultado = mongoTemplate
                    .getDb()
                    .runCommand(new Document("ping", 1));

            log.info(
                    "MongoDB: conexão OK com o banco '{}' (ping ok={})",
                    mongoTemplate.getDb().getName(),
                    resultado.get("ok")
            );
        } catch (Exception e) {
            log.error("MongoDB: falha ao conectar — {}", e.getMessage());
        }
    }
}
