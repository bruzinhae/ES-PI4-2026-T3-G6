package br.faculdade.acaistudy.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import br.faculdade.acaistudy.model.UserAccount;

public interface UserAccountRepository extends MongoRepository<UserAccount, String> {
    Optional<UserAccount> findByNormalizedEmail(String normalizedEmail);
}
