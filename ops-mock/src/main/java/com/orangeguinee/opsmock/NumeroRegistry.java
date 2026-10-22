package com.orangeguinee.opsmock;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.HashSet;
import java.util.Set;

/**
 * Enregistre dans un fichier txt les numeros et sims deja crees, une ligne "numero;sim" par creation
 * (les anciennes lignes ne contenant que le numero sont toujours lues).
 */
@Component
public class NumeroRegistry {

    private final Path file;
    private final Set<String> numeros = new HashSet<>();
    private final Set<String> sims = new HashSet<>();

    public NumeroRegistry(@Value("${mock.numeros.file}") String file) throws IOException {
        this.file = Paths.get(file);
        if (Files.exists(this.file)) {
            Files.readAllLines(this.file, StandardCharsets.UTF_8).stream()
                .map(String::trim)
                .filter(l -> !l.isEmpty())
                .forEach(l -> {
                    String[] parts = l.split(";", 2);
                    numeros.add(parts[0].trim());
                    if (parts.length > 1 && !parts[1].isBlank()) {
                        sims.add(parts[1].trim());
                    }
                });
        }
    }

    /** Enregistre le numero et la sim ; retourne le message d'erreur si l'un des deux existe deja, sinon null. */
    public synchronized String enregistrer(String numero, String sim) {
        String n = numero.trim();
        String s = sim.trim();
        if (numeros.contains(n)) {
            return "Le numero " + n + " existe deja";
        }
        if (sims.contains(s)) {
            return "La sim " + s + " est deja utilisee";
        }
        try {
            if (file.getParent() != null) {
                Files.createDirectories(file.getParent());
            }
            Files.writeString(file, n + ";" + s + System.lineSeparator(), StandardCharsets.UTF_8,
                StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        numeros.add(n);
        sims.add(s);
        return null;
    }
}
